from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Load YOLO model
try:
    model = YOLO('./model_weights/best.pt')
    model_loaded = True
    print("✓ YOLO model loaded successfully")
except Exception as e:
    model_loaded = False
    print(f"✗ Error loading model: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded
    })

@app.route('/api/detect', methods=['POST'])
def detect():
    if not model_loaded:
        return jsonify({'success': False, 'error': 'Model not loaded'}), 500
    
    try:
        file = request.files['file']
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))
        img_array = np.array(img)
        
        # Run detection
        results = model(img_array, conf=0.3)
        
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = model.names[cls]
                
                detections.append({
                    'class': class_name,
                    'confidence': conf,
                    'x': int(x1),
                    'y': int(y1),
                    'w': int(x2 - x1),
                    'h': int(y2 - y1)
                })
        
        return jsonify({
            'success': True,
            'detections': detections
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)