# Setup Instructions

## Chrome Extension

Visit - http://peitho.mbrenn.net/ , follow readme


Old - For Development Only

Ensure you have React's most recent LTS version installed (may work with other versions)

run `cd chrome-extension`

run `npm install`

run `npm run build`

Then, open `chrome://extensions/` and enable `developer mode`

Finally, `load unpacked` and select the `build` folder

## Python Server - (Not needed with current implementation)

run `cd backend`

run `pip install -r requirements.txt`

then run `shell start.sh` from the main folder
