# PPE Detection System

Real-time Personal Protective Equipment (PPE) detection system using YOLOv11 for workplace safety monitoring.

## 📋 Overview

This system detects and monitors the usage of personal protective equipment in workplace environments through image and video analysis. It identifies 14 different classes including safety violations and compliance.

## 🎯 Features

- **Real-time Detection**: Process images and videos to detect PPE compliance
- **Multi-class Detection**: Identifies 14 classes including:
  - Compliant: Hardhat, Safety Vest, Mask, Gloves, Goggles
  - Violations: NO-Hardhat, NO-Safety Vest, NO-Mask, NO-Gloves, NO-Goggles
  - Safety Objects: Person, Ladder, Safety Cone, Fall-Detected
- **Interactive Dashboard**: Modern React-based interface with real-time notifications
- **Video Analysis**: Frame-by-frame processing with play/pause controls
- **Performance Monitoring**: Live statistics for violations and compliance
- **Color-coded Alerts**: Visual feedback for different safety statuses

## 🏗️ Project Structure

```
PPE/
├── Backend/
│   ├── app.py                      # Flask API server
│   ├── basicsWebcam.py            # Webcam detection script
│   ├── requirements.txt           # Python dependencies
│   ├── model_weights/
│   │   └── best.pt               # Trained YOLOv11 model
│   └── model_training/
│       ├── model_training.ipynb  # Training notebook
│       └── PPE/                  # Dataset (44,002 images)
│
└── Frontend/
    ├── src/
    │   ├── App.jsx               # Main React component
    │   └── main.jsx              # React entry point
    ├── index.html
    └── package.json
```

## 📊 Model Performance

The YOLOv11-small model was trained for 25 epochs on 30,765 training images and validated on 8,814 images.

### Overall Metrics
- **Precision**: 71.2% - How often detections are correct
- **Recall**: 83.2% - How many actual objects are detected
- **mAP@50**: 78.2% - Average precision at 50% IoU threshold
- **mAP@50-95**: 51.4% - Average precision across IoU thresholds (50%-95%)
- **Fitness Score**: 51.4% - Combined metric for model quality

### Per-Class Performance

| Class | Images | Instances | Precision | Recall | mAP@50 | mAP@50-95 |
|-------|--------|-----------|-----------|--------|---------|-----------|
| Fall-Detected | 899 | 899 | 74.2% | 85.9% | 86.4% | 57.7% |
| Gloves | 395 | 858 | 83.2% | 92.4% | 94.8% | 50.1% |
| Goggles | 746 | 827 | 81.2% | 98.5% | 96.6% | 60.1% |
| Hardhat | 3,191 | 8,952 | 81.2% | 90.8% | 90.7% | 53.9% |
| Ladder | 193 | 202 | 92.8% | 94.1% | 95.9% | 82.0% |
| Mask | 292 | 554 | 47.9% | 89.4% | 53.5% | 42.7% |
| NO-Gloves | 571 | 1,258 | 79.2% | 86.6% | 89.0% | 43.8% |
| NO-Goggles | 679 | 859 | 81.3% | 95.7% | 95.4% | 57.8% |
| NO-Hardhat | 865 | 2,222 | 60.4% | 88.5% | 76.4% | 51.1% |
| NO-Mask | 327 | 505 | 55.8% | 86.1% | 62.7% | 45.0% |
| NO-Safety Vest | 189 | 361 | 33.4% | 35.0% | 24.8% | 12.0% |
| Person | 193 | 277 | 90.5% | 89.9% | 92.3% | 76.7% |
| Safety Cone | 338 | 3,016 | 73.4% | 61.5% | 66.3% | 36.5% |
| Safety Vest | 609 | 1,287 | 61.9% | 69.8% | 69.7% | 50.5% |

### Training Details
- **Model**: YOLOv11-small
- **Parameters**: 9,433,210
- **GFLOPs**: 21.6
- **Training Time**: 4.7 hours
- **Image Size**: 640x640
- **Batch Size**: 16
- **Device**: NVIDIA Tesla T4 GPU

## 🚀 Installation

### Backend Setup

1. Navigate to the Backend folder:
```bash
cd Backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

Server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the Frontend folder:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Application will be available at `http://localhost:5173`

## 🎮 Usage

### Web Interface

1. Open the frontend application
2. Upload an image or video file
3. View real-time detections with bounding boxes
4. Monitor statistics and safety notifications
5. For videos, use play/pause controls

### API Endpoints

#### Health Check
```
GET /api/health
```
Response:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

#### Detection
```
POST /api/detect
```
Body: `multipart/form-data` with `file` field

Response:
```json
{
  "success": true,
  "detections": [
    {
      "class": "Hardhat",
      "confidence": 0.95,
      "x": 100,
      "y": 150,
      "w": 80,
      "h": 100
    }
  ]
}
```

## 📈 Performance Metrics Explained

- **Precision (71.2%)**: When the model says "this is a hardhat", it's correct 71.2% of the time. Lower precision means more false positives.

- **Recall (83.2%)**: The model finds 83.2% of all actual PPE items in the image. Higher recall means fewer missed detections.

- **mAP@50 (78.2%)**: Average precision when allowing 50% overlap between predicted and actual bounding boxes. Industry standard metric.

- **mAP@50-95 (51.4%)**: Stricter metric requiring precise bounding box alignment (50% to 95% overlap). Lower values indicate room for localization improvement.

- **Fitness (51.4%)**: Combined metric used to select the best model during training. Balances precision, recall, and localization accuracy.

## 🛠️ Technologies Used

### Backend
- Python 3.x
- Flask - Web framework
- Ultralytics YOLOv11 - Object detection
- OpenCV - Image processing
- PyTorch - Deep learning framework

### Frontend
- React 18
- Vite - Build tool
- Tailwind CSS - Styling
- Lucide React - Icons

## 📦 Dataset

- **Source**: Roboflow Universe
- **Total Images**: 44,002
- **Training Set**: 30,765 images
- **Validation Set**: 8,814 images
- **Test Set**: 2,423 images
- **Format**: YOLOv11
- **Annotations**: 14 classes with bounding boxes

## 🎯 Use Cases

- Construction site safety monitoring
- Manufacturing facility compliance
- Warehouse safety audits
- Real-time violation alerts
- Safety training and education
- Automated safety reporting

## 📝 License

Dataset: CC BY 4.0

## 🙏 Acknowledgments

- Dataset from [Roboflow Universe](https://universe.roboflow.com/roboflow-universe-projects/personal-protective-equipment-combined-model)
- YOLOv11 by [Ultralytics](https://github.com/ultralytics/ultralytics)

## 📧 Contact

For questions or support, please open an issue in the repository.