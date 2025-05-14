from flask import Flask, request, jsonify, render_template, session
from openai import OpenAI
from dotenv import load_dotenv
import os
from datetime import datetime
import json
import requests
import time
from flask_sqlalchemy import SQLAlchemy

########################################################################################
########################################################################################
# import requests
# import json
# import time

class PicLumenAPI:
    def __init__(self, authorization_token):
        self.base_url = "https://api.piclumen.com"
        self.headers = {
            "accept": "application/json, text/plain, */*",
            "authorization": authorization_token,
            "content-type": "application/json;charset=UTF-8",
            "platform": "Web",
            "origin": "https://piclumen.com",
            "referer": "https://piclumen.com/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
        }
        
    def create_image_generation_task(self, prompt, model_id="23887bba-507e-4249-a0e3-6951e4027f2b", aspect_ratio="1:1", style="cartoon"):
        url = f"{self.base_url}/api/gen/create"
        
        # Map aspect ratio to resolution
        resolution_map = {
            "1:1": {"width": 1024, "height": 1024},
            "16:9": {"width": 1024, "height": 576},
            "9:16": {"width": 576, "height": 1024}
        }
        
        # Map style to model_id
        style_model_map = {
            "cartoon": "23887bba-507e-4249-a0e3-6951e4027f2b",
            "realistic": "23887bba-507e-4249-a0e3-6951e4027f2b",
            "anime": "23887bba-507e-4249-a0e3-6951e4027f2b",
            "pixel": "23887bba-507e-4249-a0e3-6951e4027f2b"
        }
        
        resolution = resolution_map.get(aspect_ratio, resolution_map["1:1"])
        model_id = style_model_map.get(style, style_model_map["cartoon"])
        
        payload = {
            "highPixels": False,
            "model_id": model_id,
            "prompt": prompt + "\n",
            "cfg": 1,
            "continueCreate": False,
            "denoise": 1,
            "hires_fix_denoise": 0.5,
            "hires_scale": 2,
            "img_control_info": {"style_list": []},
            "model_ability": {},
            "multi_img2img_info": {"style_list": []},
            "negative_prompt": "",
            "ponyTags": {},
            "resolution": {"width": resolution["width"], "height": resolution["height"], "batch_size": 1},
            "sampler_name": "euler",
            "scheduler": "normal",
            "seed": 31857089149,
            "steps": 6
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
    
    def check_task_status(self, mark_id):
        url = f"{self.base_url}/api/task/batch-process-task"
        payload = [mark_id]
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
    
    def generate_image(self, prompt, model_id=None, aspect_ratio="1:1", style="cartoon", max_retries=10, delay=2):
        # Step 1: Create the generation task
        if model_id is None:
            model_id = "23887bba-507e-4249-a0e3-6951e4027f2b"
            
        create_response = self.create_image_generation_task(prompt, model_id, aspect_ratio, style)
        mark_id = create_response["data"]["markId"]
        
        # Step 2: Poll for the result
        for _ in range(max_retries):
            status_response = self.check_task_status(mark_id)
            
            if status_response["data"][0]["status"] == "success":
                return status_response["data"][0]["img_urls"]
            elif status_response["data"][0]["status"] == "failed":
                raise Exception("Image generation failed")
            
            time.sleep(delay)
        
        raise Exception("Image generation timed out")
########################################################################################
########################################################################################
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Required for session management

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///memes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class GeneratedMeme(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prompt = db.Column(db.String(500), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    aspect_ratio = db.Column(db.String(10), nullable=False)
    style = db.Column(db.String(20), nullable=False)
    preference = db.Column(db.String(10), nullable=False)
    api_used = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_message = db.Column(db.String(500), nullable=False)

# Create database tables
with app.app_context():
    db.create_all()

# Initializing OpenRouter client for text generation
openrouter = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)
# Initializing Recraft AI client for image generation
recraft = OpenAI(
    base_url="https://external.api.recraft.ai/v1",
    api_key=os.getenv("RECRAFT_API_KEY")
)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat')
def chat():
    # Initialize chat history and current chat if not exists
    if 'chat_history' not in session:
        session['chat_history'] = []
    if 'current_chat' not in session:
        session['current_chat'] = []
    return render_template('chat.html')

@app.route('/chat-message', methods=['POST'])
def chat_message():
    try:
        data = request.get_json()
        message = data['message']
        
        # Initialize session variables if not exists
        if 'chat_history' not in session:
            session['chat_history'] = []
        if 'current_chat' not in session:
            session['current_chat'] = []
        
        # Create new chat entry for user message
        new_chat = {
            'timestamp': datetime.now().isoformat(),
            'user_message': message,
            'is_meme': False,
            'type': 'user'
        }
        
        # Add user message to current chat
        session['current_chat'].append(new_chat)
        
        # If this is the first message in the current chat, add it to history
        if len(session['current_chat']) == 1:
            session['chat_history'].append(session['current_chat'])
            # Limit chat history to last 10 chats
            if len(session['chat_history']) > 10:
                session['chat_history'] = session['chat_history'][-10:]
        
        session.modified = True
        
        # Generate a funny response using OpenRouter
        print(openrouter.api_key)
        completion = openrouter.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            messages=[
                {
                    "role": "user",
                    "content": f"You are a funny, memer chatbot. Respond to this message in a humorous way and remeber not to entertain any other query, on such queries reply them in a savage way that you are a memer and not someone else according to the user's query and command them to use the .meme command to generate memes(only if you feel where user wants to generate meme and don't know how to do it) and also remeber to keep your response short and precise most of the times: {message}"
                }
            ]
        )
        
        response = completion.choices[0].message.content
        
        # Create new chat entry for bot response
        bot_chat = {
            'timestamp': datetime.now().isoformat(),
            'user_message': response,
            'is_meme': False,
            'type': 'assistant'
        }
        
        # Add bot response to current chat
        session['current_chat'].append(bot_chat)
        session.modified = True
        
        return jsonify({
            "response": response
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate_meme():
    try:
        data = request.get_json()
        topic = data['topic']
        
        # Check if the message starts with .meme
        if not topic.startswith('.meme '):
            return jsonify({"error": "Invalid meme command. Use '.meme' prefix to generate memes."}), 400
            
        # Remove the .meme prefix
        topic = topic[6:].strip()
        
        aspect_ratio = data.get('aspect_ratio', '1:1')
        style = data.get('style', 'cartoon')
        preference = data.get('preference', 'speed')  # Default to speed
        
        # Initialize session variables if not exists
        if 'chat_history' not in session:
            session['chat_history'] = []
        if 'current_chat' not in session:
            session['current_chat'] = []
        
        # Create new chat entry for user message
        new_chat = {
            'timestamp': datetime.now().isoformat(),
            'user_message': topic,
            'is_meme': True,
            'type': 'user',
            'aspect_ratio': aspect_ratio,
            'style': style,
            'preference': preference
        }
        
        # Add to current chat
        session['current_chat'].append(new_chat)
        
        # If this is the first message in the current chat, add it to history
        if len(session['current_chat']) == 1:
            session['chat_history'].append(session['current_chat'])
            # Limit chat history to last 10 chats
            if len(session['chat_history']) > 10:
                session['chat_history'] = session['chat_history'][-10:]
        
        session.modified = True
        
        base_prompt = f"Generate a humorous meme image prompt on the topic '{topic}' with a visually exaggerated and ironic representation. The meme should be instantly funny and relatable, even without deep knowledge of the subject. It should include a clear and witty caption within the image description. Use expressive characters, dramatic reactions, or absurd scenarios to highlight contrast or irony. The style should be {style} with bold text overlays. The final prompt should be a single paragraph containing both the image description and the overlayed text to ensure the AI image generator produces a complete and coherent meme. And remember not to include any other text except prompt."

        # Generating meme prompt using OpenRouter
        completion = openrouter.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            messages=[
                {
                    "role": "user",
                    "content": base_prompt
                }
            ]
        )
        meme_prompt = completion.choices[0].message.content

        if preference == 'speed':
            # Use PicLumen API for speed
            AUTHORIZATION_TOKEN = "21d94fad56039cc375298ef4def34b824ec48e9b"
            api = PicLumenAPI(AUTHORIZATION_TOKEN)
            result = api.generate_image(meme_prompt, aspect_ratio=aspect_ratio, style=style)
            image_url = result[0]['imgUrl']
            api_used = 'piclumen'
        else:
            # Use Recraft API for quality
            try:
                image_response = recraft.images.generate(
                    prompt=meme_prompt,
                    style="digital_illustration",
                    model="recraftv3",
                )
                
                if not image_response or not image_response.data or not image_response.data[0].url:
                    raise Exception("Invalid response from Recraft API")
                    
                image_url = image_response.data[0].url
                api_used = 'recraft'
            except Exception as e:
                print(f"Recraft API error: {str(e)}")
                # Fallback to PicLumen if Recraft fails
                AUTHORIZATION_TOKEN = "21d94fad56039cc375298ef4def34b824ec48e9b"
                api = PicLumenAPI(AUTHORIZATION_TOKEN)
                result = api.generate_image(meme_prompt, aspect_ratio=aspect_ratio, style=style)
                image_url = result[0]['imgUrl']
                api_used = 'piclumen'
        
        # Store in database
        new_meme = GeneratedMeme(
            prompt=meme_prompt,
            image_url=image_url,
            aspect_ratio=aspect_ratio,
            style=style,
            preference=preference,
            api_used=api_used,
            user_message=topic
        )
        db.session.add(new_meme)
        db.session.commit()
        
        # Create new chat entry for bot response with image
        bot_chat = {
            'timestamp': datetime.now().isoformat(),
            'user_message': '',  # Empty message since we're showing an image
            'is_meme': True,
            'type': 'assistant',
            'image_url': image_url
        }
        
        # Add bot response to current chat
        session['current_chat'].append(bot_chat)
        session.modified = True
        
        return jsonify({
            "image_url": image_url
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat-history', methods=['GET'])
def get_chat_history():
    try:
        # Ensure chat_history exists in session
        if 'chat_history' not in session:
            session['chat_history'] = []
        return jsonify(session.get('chat_history', []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/current-chat', methods=['GET'])
def get_current_chat():
    try:
        # Ensure current_chat exists in session
        if 'current_chat' not in session:
            session['current_chat'] = []
        return jsonify(session.get('current_chat', []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/new-chat', methods=['POST'])
def new_chat():
    try:
        # Save current chat to history if not empty
        if 'current_chat' in session and session['current_chat']:
            if 'chat_history' not in session:
                session['chat_history'] = []
            
            # Only add to history if it's not already there
            if session['current_chat'] not in session['chat_history']:
                session['chat_history'].append(session['current_chat'])
            
            # Limit chat history to last 10 chats
            if len(session['chat_history']) > 10:
                session['chat_history'] = session['chat_history'][-10:]
        
        # Clear current chat
        session['current_chat'] = []
        session.modified = True
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/meme-history', methods=['GET'])
def get_meme_history():
    try:
        memes = GeneratedMeme.query.order_by(GeneratedMeme.created_at.desc()).all()
        return jsonify([{
            'id': meme.id,
            'prompt': meme.prompt,
            'image_url': meme.image_url,
            'aspect_ratio': meme.aspect_ratio,
            'style': meme.style,
            'preference': meme.preference,
            'api_used': meme.api_used,
            'created_at': meme.created_at.isoformat(),
            'user_message': meme.user_message
        } for meme in memes])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)