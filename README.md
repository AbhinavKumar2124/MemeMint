# MemeMint 🎨

MemeMint is an AI-powered meme generation platform that combines chat functionality with advanced image generation capabilities. Create, customize, and share memes through an intuitive interface while chatting with a meme-savvy AI assistant.

<p align="center">
  <img src="https://github.com/AbhinavKumar2124/MemeMint/blob/master/Images/Screenshot%20(99).png" width="45%" />
  <img src="https://github.com/AbhinavKumar2124/MemeMint/blob/master/Images/Screenshot%20(100).png" width="45%" />
</p>

## ✨ Features

### 🤖 Dual-Mode Interface
- **Chat Mode**: Interact with a meme-focused AI assistant
- **Meme Generation**: Create memes using the `.meme` command

### 🎨 Customization Options
- Multiple aspect ratios (1:1, 16:9, 9:16)
- Various visual styles:
  - Cartoon
  - Realistic
  - Anime
  - Pixel
- Generation preferences:
  - Speed mode (faster generation)
  - Quality mode (higher detail)

### 🌓 User Experience
- Dark/Light theme toggle
- Real-time preview
- Session-based chat history
- Share functionality
- Responsive design
- Markdown support in chat

## 🚀 Getting Started

### Prerequisites
- Python 3.x
- pip (Python package manager)
- API keys for:
  - OpenRouter API
  - Recraft AI API

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AbhinavKumar2124/MemeMint.git
cd MemeMint
```

2. Create and activate a virtual environment:
```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
RECRAFT_API_KEY=your_recraft_api_key_here
```

### Running the Application

1. Start the Flask server:
```bash
python app.py
# The database will be automatically created on first run
```

2. Open your browser and navigate to:
```bash
http://localhost:5000
```

## 💬 Usage

### Regular Chat
Simply type your message and press enter to chat with the AI assistant.

### Meme Generation
1. Type `.meme` followed by your meme topic
   ```
   .meme cats in space
   ```
2. Select your preferred style and aspect ratio
3. Choose between speed and quality generation
4. Wait for your meme to be generated
5. Share or download your creation

## 🛠️ Tech Stack

### Frontend
- HTML5/CSS3
- JavaScript
- Tailwind CSS
- Font Awesome
- Marked.js (Markdown parsing)

### Backend
- Python/Flask
- SQLAlchemy
- SQLite
- OpenRouter API (LLaMA 3.3 70B model)
- PicLumen API
- Recraft AI API

## 📝 API Documentation

### OpenRouter API
Used for generating contextual chat responses and meme prompts.
- Model: meta-llama/llama-3.3-70b-instruct
- Documentation: [OpenRouter API Docs](https://openrouter.ai/docs)

### Image Generation APIs
- **PicLumen API**: Fast image generation
- **Recraft AI**: High-quality image generation

## 🔐 Security

- Environment variables for API keys
- Session-based storage
- XSS protection
- Secure file handling
- Database security measures

## 📁 Project Structure

```
memeMint/
├── app.py # Main application file
├── requirements.txt # Python dependencies
├── .env # Environment variables (create this)
├── instance/ # SQLite database
├── static/
│ ├── chat.js # Frontend JavaScript
│ ├── chat.css # Styling
│ └── index.css # Styling
└── templates/
  ├── index.html # Landing page
  └── chat.html # Main chat interface
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenRouter API for text generation
- PicLumen and Recraft AI for image generation
- Flask community for the excellent web framework
- All contributors and users of MemeMint

## 🐛 Known Issues

- Session timeout after extended periods
- Image generation may take longer in quality mode

## 📞 Support

For support, please:
- Open an issue in the repository
- Contact the maintainers
- Check the [Wiki](wiki_link) for common solutions

## 🚀 Future Enhancements

- User authentication system
- Meme template library
- Advanced image editing tools
- Social sharing features
- Mobile app version
- Community features
- Custom style training

---

Made with ❤️ by team NODEX
