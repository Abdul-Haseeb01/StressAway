# FER2013 Emotion Recognition Model

This directory contains the machine learning model for facial emotion recognition using the FER2013 dataset.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure FER2013 dataset is available in the parent directory:
```
../FER2013/
  ├── train/
  │   ├── angry/
  │   ├── disgust/
  │   ├── fear/
  │   ├── happy/
  │   ├── sad/
  │   ├── surprise/
  │   └── neutral/
  └── test/
      ├── angry/
      ├── disgust/
      ├── fear/
      ├── happy/
      ├── sad/
      ├── surprise/
      └── neutral/
```

## Training the Model

Basic training (30 epochs):
```bash
python train.py --dataset-path ../FER2013
```

Custom training parameters:
```bash
python train.py --dataset-path ../FER2013 --epochs 50 --batch-size 64 --learning-rate 0.001
```

## Model Architecture

- **Input**: 48x48 grayscale images
- **Architecture**: 4 convolutional blocks with batch normalization and dropout
- **Output**: 7 emotion classes (angry, disgust, fear, happy, sad, surprise, neutral)
- **Total Parameters**: ~5-6 million

## Inference

Predict emotion from an image:
```bash
python inference.py --image path/to/image.jpg --model models/emotion_model_best.h5
```

## Convert to TensorFlow.js

For browser-based inference:
```bash
python convert_to_tfjs.py --model models/emotion_model_best.h5 --output tfjs_model
```

Then copy the `tfjs_model` directory to your frontend's `public` folder.

## Files

- `data_loader.py` - Data loading and preprocessing
- `model.py` - CNN model architecture
- `train.py` - Training script
- `inference.py` - Prediction script
- `convert_to_tfjs.py` - TensorFlow.js conversion
- `requirements.txt` - Python dependencies

## Emotion to Stress Mapping

The model calculates stress scores using weighted emotion probabilities:

- Angry: 0.9
- Fear: 0.85
- Sad: 0.75
- Disgust: 0.7
- Surprise: 0.4
- Neutral: 0.3
- Happy: 0.1

Stress Score = (Σ emotion_probability × weight) × 100

## Notes

- Training may take several hours depending on your hardware
- GPU acceleration is recommended for faster training
- The model achieves ~60-65% accuracy on FER2013 (typical for this dataset)
- For production use, consider training for more epochs and fine-tuning hyperparameters
