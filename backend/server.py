from flask import Flask, request
from flask_cors import CORS
from bs4 import BeautifulSoup
import random

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
    soup = BeautifulSoup(request.get_json()["html"], "html.parser")
    transcript_container = soup.find("ytd-transcript-segment-list-renderer")
    if transcript_container:
        segments = transcript_container.find_all("ytd-transcript-segment-renderer")
        transcript_dict = {}

        for segment in segments:
            timestamp = segment.find("div", class_="segment-timestamp").text.strip()
            transcript_text = segment.find(
                "yt-formatted-string", class_="segment-text"
            ).text.strip()
            transcript_dict[timestamp] = {
                "text": transcript_text,
                "labels": random.choice(LABELS),
            }

    with open("output_formatted.txt", "w", encoding="utf-8") as file:
        print(transcript_dict, file=file)

    return {"success": transcript_dict}
