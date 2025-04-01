import assemblyai as aai
import yt_dlp
from flask import Flask, request
from flask_cors import CORS
import random
import os
import nltk
import string
import re
import json
from urllib.parse import urlparse, parse_qs
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

app = Flask(__name__)
cors = CORS(app)
LABELS = [
    "Communicative Metareference",
    "Gratitude/Congratulations",
    "General Claim Statistical",
    "General Claim Non-statistical",
    "Self Claims - Political Track Record",
]

uri = os.getenv("MONGO_URI")
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['user-paths']
videos_collection = db['videos']


class UtteranceSeparator:
    def __init__(self):
        nltk.download('punkt')
        nltk.download('punkt_tab')
        nltk.download('cmudict')
        self.cmu_dict = nltk.corpus.cmudict.dict()

    def count_syllables(self, word):
        """
        Count syllables for a single word using CMU dictionary if available,
        else use a heuristic method.
        """
        # Remove punctuation and convert to lowercase.
        word = re.sub(r'[^\w\s]', '', word).lower()
        if word in self.cmu_dict:
            # The dictionary may have multiple pronunciations; pick the first one.
            pronunciation = self.cmu_dict[word][0]
            # Count the number of vowel sounds (they end with a digit).
            syllable_count = len(
                [phoneme for phoneme in pronunciation if phoneme[-1].isdigit()])
            return syllable_count
        else:
            return self.heuristic_syllable_count(word)

    def heuristic_syllable_count(self, word):
        """
        A simple heuristic to estimate syllable count for a word.
        This method is less reliable than the CMU dictionary.
        """
        word = word.lower()
        vowels = "aeiouy"
        count = 0

        # Count transitions from a non-vowel to a vowel.
        if word and word[0] in vowels:
            count += 1
        for index in range(1, len(word)):
            if word[index] in vowels and word[index - 1] not in vowels:
                count += 1

        # Remove a syllable for silent 'e' endings.
        if word.endswith("e"):
            count -= 1

        # Ensure at least one syllable.
        return count if count > 0 else 1

    def count_text_syllables(self, text):
        """
        Count syllables in a text string by splitting it into words.
        """
        # Use regex to extract words (this removes punctuation).
        words = re.findall(r'\w+', text)
        total_syllables = sum(self.count_syllables(word) for word in words)
        return total_syllables

    def get_index_ranges(self, percentages, total, start_index, end_index):
        """
        Given a list of percentages that sum to 1 and a total length,
        returns a list of [start, end] index ranges corresponding to each percentage.
        """
        # Create cumulative boundaries by multiplying the cumulative sum with total
        boundaries = [0]
        cumulative = 0
        for p in percentages:
            cumulative += p * total
            # Round to the nearest integer for the boundary
            boundaries.append(int(round(cumulative)))

        # Now generate the index ranges
        ranges = []
        for i in range(len(percentages)):
            start = boundaries[i]
            end = boundaries[i+1] - 1  # end index is inclusive
            ranges.append([start + start_index, end + start_index])
        ranges[-1][1] = end_index
        return ranges

    def preprocess_abbreviations_extended(self, text):
        # Dictionary of common abbreviations and their temporary replacements
        common_abbrev = {
            # U.S.A. -> USA
            r'(?<![\w.])((?:[A-Z]\.[A-Z]\.)+(?:[A-Z])?\.?)': lambda m: m.group(0).replace('.', ''),
            # Mr. -> Mr
            r'(?<![\w.])(Mr\.|Mrs\.|Dr\.|Prof\.)': lambda m: m.group(0).replace('.', ''),
            # a.m. -> am
            r'(?<![\w.])(a\.m\.|p\.m\.)': lambda m: m.group(0).replace('.', ''),
        }

        processed_text = text
        replacements = {}

        for pattern, replacement_func in common_abbrev.items():
            def replace_match(match):
                original = match.group(0)
                replaced = replacement_func(match)
                replacements[replaced] = original
                return replaced

            processed_text = re.sub(pattern, replace_match, processed_text)

        return processed_text, replacements

    def clean_text(self, text):
        valid_chars = string.ascii_letters + string.digits + \
            "".join([" ", ".", "?", "!", ",", "\'"])
        text = "".join([i if i in valid_chars else " " for i in text])
        while "  " in text:
            text = text.replace("  ", " ")
        text = text.strip()
        return text

    def rebuild_utterance_data(self, data):
        speakers_list = data['speakers']
        speaker_map = dict([(j, i+1)
                           for i, j in enumerate(sorted(speakers_list))])
        speakers_list = [speaker_map[i] for i in speakers_list]
        all_utterances = []
        for i in range(len(data['utterances'])):
            text = data['utterances'][i]['text']
            speaker = speaker_map[data['utterances'][i]['speaker']]
            label = data['utterances'][i]['label']
            start_index = data['utterances'][i]['start']
            end_index = data['utterances'][i]['end']

            run_time = end_index - start_index
            cleaned_text = self.clean_text(text)
            cleaned_data, replacements = self.preprocess_abbreviations_extended(
                cleaned_text)
            utterances = nltk.sent_tokenize(cleaned_data)
            syllables = [self.count_text_syllables(j) for j in utterances]
            total_syllables = sum(syllables)
            syllables = [j/total_syllables for j in syllables]
            start_end_indices = self.get_index_ranges(
                syllables, run_time, start_index, end_index)
            for j in range(len(start_end_indices)):
                all_utterances.append({
                    'speaker': speaker,
                    'text': utterances[j],
                    'start': start_end_indices[j][0],
                    'end': start_end_indices[j][1],
                    'label': label
                })
        output_data = {
            'utterances': all_utterances,
            'speakers': speakers_list
        }
        return output_data


utterance_seperator = UtteranceSeparator()


@app.route("/process_transcript", methods=["POST"])
def process_transcript():
    raw_url = request.get_json()["url"]
    parsed_url = urlparse(raw_url)
    query_params = parse_qs(parsed_url.query)
    video_id = query_params.get("v", [None])[0]

    if not video_id:
        return {"error": "Invalid YouTube URL"}, 400

    url = f"{parsed_url.scheme}://{parsed_url.netloc}/watch?v={video_id}"

    existing_video = videos_collection.find_one({"url": url})
    if existing_video:
        return {"utterances": existing_video["utterances"], "speakers": existing_video["speakers"]}

    utterances = []

    options = {
        'format': 'bestaudio[ext=webm]',
        'outtmpl': 'videos/%(title)s.%(ext)s',
    }

    with yt_dlp.YoutubeDL(options) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info_dict)

    aai.settings.api_key = os.getenv("ASSEMBLY_AI_API")
    config = aai.TranscriptionConfig(speaker_labels=True)
    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(file_path, config=config)
    utterances = [
        {
            "speaker": utterance.speaker,
            "text": utterance.text,
            "start": utterance.start,
            "end": utterance.end,
            "label": random.choice(LABELS),
        }
        for utterance in transcript.utterances
    ]

    speakers_set = set()
    for utterance in utterances:
        speakers_set.add(utterance["speaker"])

    seperated_data = utterance_seperator.rebuild_utterance_data({
        "utterances": utterances,
        "speakers": list(speakers_set)
    })

    video_data = {
        "url": url,
        "utterances": seperated_data["utterances"],
        "speakers": seperated_data["speakers"]
    }

    # with open("output_formatted.txt", "w", encoding="utf-8") as file:
    #     json.dump(video_data, file, indent=4)

    videos_collection.insert_one(video_data)

    try:
        os.remove(file_path)
    except Exception as e:
        print(f"An error occurred: {e}")

    return {"utterances": seperated_data["utterances"], "speakers": seperated_data["speakers"]}
