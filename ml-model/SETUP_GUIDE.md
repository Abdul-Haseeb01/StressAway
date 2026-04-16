# ML Model Setup Guide

## Prerequisites

Since Python is not currently installed on your system, you'll need to install it first before training the emotion recognition model.

### Install Python

1. Download Python 3.10 or higher from https://www.python.org/downloads/
2. During installation, **check "Add Python to PATH"**
3. Verify installation:
```bash
python --version
pip --version
```

## Quick Start (After Python Installation)

### 1. Install Dependencies

```bash
cd ml-model
pip install -r requirements.txt
```

This will install:
- TensorFlow 2.13+
- NumPy
- OpenCV
- Pillow
- Matplotlib
- scikit-learn
- TensorFlow.js converter

### 2. Prepare FER2013 Dataset

Download the FER2013 dataset and organize it as follows:

```
StressAway/
├── FER2013/
│   ├── train/
│   │   ├── angry/
│   │   ├── disgust/
│   │   ├── fear/
│   │   ├── happy/
│   │   ├── sad/
│   │   ├── surprise/
│   │   └── neutral/
│   └── test/
│       ├── angry/
│       ├── disgust/
│       ├── fear/
│       ├── happy/
│       ├── sad/
│       ├── surprise/
│       └── neutral/
└── ml-model/
```

**Dataset Sources:**
- Kaggle: https://www.kaggle.com/datasets/msambare/fer2013
- Official: https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge

### 3. Train the Model

**Quick Training (30 epochs, ~2-3 hours on CPU):**
```bash
python train.py --dataset-path ../FER2013 --epochs 30 --batch-size 64
```

**Full Training (50 epochs, better accuracy):**
```bash
python train.py --dataset-path ../FER2013 --epochs 50 --batch-size 64 --learning-rate 0.001
```

**Training Output:**
- `models/emotion_model_best.h5` - Best model (highest validation accuracy)
- `models/emotion_model_final.h5` - Final model after all epochs
- `models/training_history.png` - Training/validation curves
- `logs/` - TensorBoard logs

### 4. Test the Model

**Single Image Prediction:**
```bash
python inference.py --image path/to/test_image.jpg
```

**Expected Output:**
```
Predicted Emotion: happy
Confidence: 87.3%
Stress Score: 15.2/100

Emotion Probabilities:
  happy: 87.3%
  neutral: 8.1%
  surprise: 2.4%
  ...
```

### 5. Convert for Browser Use

Convert the trained model to TensorFlow.js format for browser-based inference:

```bash
python convert_to_tfjs.py --model models/emotion_model_best.h5 --output tfjs_model
```

Then copy to frontend:
```bash
# Windows
xcopy tfjs_model ..\frontend\public\tfjs_model\ /E /I

# Linux/Mac
cp -r tfjs_model ../frontend/public/tfjs_model/
```

## Alternative: Use Pre-trained Model

If you don't want to train from scratch, you can:

1. Download a pre-trained FER2013 model
2. Place it in `ml-model/models/emotion_model_best.h5`
3. Skip to step 5 (conversion)

## Model Architecture

```
Input: 48x48 grayscale images
├── Conv Block 1: 64 filters
├── Conv Block 2: 128 filters
├── Conv Block 3: 256 filters
├── Conv Block 4: 512 filters
├── Dense Layer: 512 units
├── Dense Layer: 256 units
└── Output: 7 emotions (softmax)

Total Parameters: ~5-6 million
```

## Expected Performance

- **Training Time**: 2-4 hours (CPU), 30-60 minutes (GPU)
- **Accuracy**: 60-65% on FER2013 test set (typical for this dataset)
- **Model Size**: ~20-25 MB (.h5), ~6-8 MB (TensorFlow.js)

## Troubleshooting

### Issue: Out of Memory
**Solution:** Reduce batch size
```bash
python train.py --batch-size 32
```

### Issue: Slow Training
**Solution:** Use GPU if available, or reduce epochs
```bash
python train.py --epochs 20
```

### Issue: Low Accuracy
**Solution:** Train for more epochs or adjust learning rate
```bash
python train.py --epochs 50 --learning-rate 0.0005
```

## Using the Model in Frontend

Once converted to TensorFlow.js, the facial emotion page will automatically use it:

1. User captures image via webcam
2. Image is preprocessed (grayscale, resize to 48x48)
3. Model predicts emotion probabilities
4. Stress score calculated from emotion weights
5. Results displayed to user

**Privacy:** Images are processed client-side and never sent to the server.

## Next Steps

1. Install Python 3.10+
2. Run `pip install -r requirements.txt`
3. Download FER2013 dataset
4. Train model with `python train.py`
5. Convert to TensorFlow.js
6. Copy to frontend public folder
7. Test facial emotion page in application

## Resources

- **FER2013 Paper**: https://arxiv.org/abs/1307.0414
- **TensorFlow Docs**: https://www.tensorflow.org/
- **TensorFlow.js**: https://www.tensorflow.org/js

---

**Note:** The backend API already has a placeholder emotion prediction endpoint. Once you have the trained model, you can integrate it for server-side predictions as well.
