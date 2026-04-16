"""
Inference Script for Emotion Recognition
Load trained model and predict emotions from images
"""

import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model


class EmotionPredictor:
    def __init__(self, model_path='models/emotion_model_final.h5'):
        """
        Initialize emotion predictor
        
        Args:
            model_path: Path to trained model
        """
        self.model = load_model(model_path)
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        self.img_size = (48, 48)
        
        import sys
        print(f"Model loaded from {model_path}", file=sys.stderr)
    
    def preprocess_image(self, image):
        """
        Preprocess image for prediction
        
        Args:
            image: Input image (numpy array or path)
            
        Returns:
            Preprocessed image ready for prediction
        """
        # If image is a path, load it
        if isinstance(image, str):
            image = cv2.imread(image, cv2.IMREAD_GRAYSCALE)
            
        if image is None:
            return None
        
        # Ensure grayscale just in case it came in as array
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
        # Detect face
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) == 0:
            return None
            
        # Get largest face
        x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
        face_crop = image[y:y+h, x:x+w]
        
        # Resize to model input size
        face_crop = cv2.resize(face_crop, self.img_size)
        
        # Normalize
        face_crop = face_crop.astype('float32') / 255.0
        
        # Reshape for model input
        face_crop = face_crop.reshape(1, self.img_size[0], self.img_size[1], 1)
        
        return face_crop
    
    def predict(self, image):
        """
        Predict emotion from image
        
        Args:
            image: Input image (numpy array or path)
            
        Returns:
            Dictionary with emotion probabilities and predicted emotion
        """
        # Preprocess image
        processed_image = self.preprocess_image(image)
        
        if processed_image is None:
            return {'error': 'No face detected in the image.'}
        
        # Get predictions
        predictions = self.model.predict(processed_image, verbose=0)[0]
        
        # Get predicted emotion
        predicted_idx = np.argmax(predictions)
        predicted_emotion = self.emotion_labels[predicted_idx]
        confidence = predictions[predicted_idx]
        
        # Create probabilities dictionary
        emotion_probs = {
            emotion: float(prob) 
            for emotion, prob in zip(self.emotion_labels, predictions)
        }
        
        return {
            'predicted_emotion': predicted_emotion,
            'confidence': float(confidence),
            'probabilities': emotion_probs
        }
    
    def calculate_stress_score(self, emotion_probs):
        """
        Calculate stress score based on dominant emotion range.
        Ranges:
          happy:   0 – 5
          neutral: 6 – 20
          surprise: 21 – 35
          disgust: 36 – 50
          fear:   51 – 60
          angry:  61 – 74
          sad:    75 – 95
        Score = range_min + confidence * (range_max - range_min)
        """
        ranges = {
            'happy':    (0,  5),
            'neutral':  (6,  20),
            'surprise': (21, 35),
            'disgust':  (36, 50),
            'fear':     (51, 60),
            'angry':    (61, 74),
            'sad':      (75, 95),
        }
        dominant = max(emotion_probs, key=emotion_probs.get)
        confidence = emotion_probs[dominant]
        low, high = ranges.get(dominant, (0, 50))
        return low + confidence * (high - low)
    
    def predict_with_stress(self, image_path):
        import base64
        
        # Load image for drawing
        original_image = cv2.imread(image_path)
        if original_image is None:
            return {'error': 'Could not read image.'}
            
        # Convert to grayscale for detection
        gray = cv2.cvtColor(original_image, cv2.COLOR_BGR2GRAY)
        
        # Detect face
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) == 0:
            # Draw red border on original_image
            h, w = original_image.shape[:2]
            cv2.rectangle(original_image, (0, 0), (w-1, h-1), (0, 0, 255), 10)
            
            _, buffer = cv2.imencode('.jpg', original_image)
            b64 = base64.b64encode(buffer).decode('utf-8')
            return {
                'error': 'No face detected in the image.',
                'boxed_image_base64': 'data:image/jpeg;base64,' + b64
            }
            
        # Get largest face
        x, y, w_f, h_f = max(faces, key=lambda rect: rect[2] * rect[3])
        
        # Draw green box
        cv2.rectangle(original_image, (x, y), (x+w_f, y+h_f), (0, 255, 0), 4)
        _, buffer = cv2.imencode('.jpg', original_image)
        b64 = base64.b64encode(buffer).decode('utf-8')
        boxed_image_base64 = 'data:image/jpeg;base64,' + b64
        
        # Crop and preprocess for model
        face_crop = gray[y:y+h_f, x:x+w_f]
        face_crop = cv2.resize(face_crop, self.img_size)
        face_crop = face_crop.astype('float32') / 255.0
        face_crop = face_crop.reshape(1, self.img_size[0], self.img_size[1], 1)
        
        # Get predictions
        predictions = self.model.predict(face_crop, verbose=0)[0]
        predicted_idx = np.argmax(predictions)
        predicted_emotion = self.emotion_labels[predicted_idx]
        confidence = float(predictions[predicted_idx])
        
        # Create probabilities dictionary
        emotion_probs = {
            emotion: float(prob) 
            for emotion, prob in zip(self.emotion_labels, predictions)
        }
        
        stress_score = self.calculate_stress_score(emotion_probs)
        
        return {
            'predicted_emotion': predicted_emotion,
            'confidence': confidence,
            'probabilities': emotion_probs,
            'stress_score': float(stress_score),
            'boxed_image_base64': boxed_image_base64
        }


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Predict emotion from image')
    parser.add_argument('--image', type=str, required=True,
                        help='Path to input image')
    parser.add_argument('--model', type=str, default='models/emotion_model_final.h5',
                        help='Path to trained model')
    parser.add_argument('--json', action='store_true',
                        help='Output raw JSON only for easy parsing')
    
    args = parser.parse_args()
    
    # Create predictor
    predictor = EmotionPredictor(args.model)
    
    # Predict emotion
    result = predictor.predict_with_stress(args.image)
    
    if args.json:
        import json
        print(json.dumps(result))
    else:
        print("\n" + "="*50)
        print("Emotion Prediction Results")
        print("="*50)
        print(f"\nPredicted Emotion: {result['predicted_emotion']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"Stress Score: {result['stress_score']:.2f}/100")
        
        print("\nEmotion Probabilities:")
        for emotion, prob in sorted(result['probabilities'].items(), key=lambda x: x[1], reverse=True):
            print(f"  {emotion}: {prob:.2%}")
        
        print("\n" + "="*50)
