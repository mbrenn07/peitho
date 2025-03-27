import assemblyai as aai
import yt_dlp
from flask import Flask, request
from flask_cors import CORS
import random
import os
import json

app = Flask(__name__)
cors = CORS(app)
LABELS = [
    "Communicative Metareference",
    "Gratitude/Congratulations",
    "General Claim Statistical",
    "General Claim Non-statistical",
    "Self Claims - Political Track Record",
]


@app.route("/process_transcript", methods=["POST"])
def process_transcript():
    url = request.get_json()["url"]
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

    with open("output_formatted.txt", "w", encoding="utf-8") as file:
        json.dump({"utterances": utterances, "speakers": list(
            speakers_set)}, file, indent=4)

    try:
        os.remove(file_path)
    except Exception as e:
        print(f"An error occurred: {e}")

    return {"utterances": utterances, "speakers": list(speakers_set)}
