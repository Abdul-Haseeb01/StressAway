"""
FER2013 Data Loader
Loads and preprocesses the FER2013 dataset for emotion recognition
"""

import os
import numpy as np
import cv2
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split

class FER2013DataLoader:
    def __init__(self, dataset_path, img_size=(48, 48)):
        """
        Initialize the data loader
        
        Args:
            dataset_path: Path to FER2013 dataset directory
            img_size: Target image size (default: 48x48)
        """
        self.dataset_path = dataset_path
        self.img_size = img_size
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        self.num_classes = len(self.emotion_labels)
        
    def load_data(self, subset='train'):
        """
        Load images and labels from dataset
        
        Args:
            subset: 'train' or 'test'
            
        Returns:
            images: numpy array of images
            labels: numpy array of labels
        """
        subset_path = os.path.join(self.dataset_path, subset)
        
        if not os.path.exists(subset_path):
            raise ValueError(f"Dataset path not found: {subset_path}")
        
        images = []
        labels = []
        
        print(f"Loading {subset} data...")
        
        for emotion_idx, emotion in enumerate(self.emotion_labels):
            emotion_path = os.path.join(subset_path, emotion)
            
            if not os.path.exists(emotion_path):
                print(f"Warning: {emotion} folder not found in {subset}")
                continue
            
            image_files = os.listdir(emotion_path)
            print(f"  {emotion}: {len(image_files)} images")
            
            for img_file in image_files:
                img_path = os.path.join(emotion_path, img_file)
                
                try:
                    # Read image in grayscale
                    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                    
                    if img is None:
                        continue
                    
                    # Resize to target size
                    img = cv2.resize(img, self.img_size)
                    
                    images.append(img)
                    labels.append(emotion_idx)
                    
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
                    continue
        
        # Convert to numpy arrays
        images = np.array(images)
        labels = np.array(labels)
        
        print(f"Loaded {len(images)} images from {subset} set")
        
        return images, labels
    
    def preprocess_data(self, images, labels, normalize=True):
        """
        Preprocess images and labels
        
        Args:
            images: numpy array of images
            labels: numpy array of labels
            normalize: whether to normalize pixel values
            
        Returns:
            preprocessed images and one-hot encoded labels
        """
        # Reshape images to add channel dimension
        images = images.reshape(-1, self.img_size[0], self.img_size[1], 1)
        
        # Normalize pixel values to [0, 1]
        if normalize:
            images = images.astype('float32') / 255.0
        
        # One-hot encode labels
        labels = to_categorical(labels, self.num_classes)
        
        return images, labels
    
    def augment_data(self, images):
        """
        Apply data augmentation (optional)
        
        Args:
            images: numpy array of images
            
        Returns:
            augmented images
        """
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        
        datagen = ImageDataGenerator(
            rotation_range=10,
            width_shift_range=0.1,
            height_shift_range=0.1,
            horizontal_flip=True,
            zoom_range=0.1
        )
        
        return datagen
    
    def load_and_preprocess(self, subset='train', validation_split=0.2):
        """
        Load and preprocess data in one step
        
        Args:
            subset: 'train' or 'test'
            validation_split: fraction of training data to use for validation
            
        Returns:
            preprocessed images and labels
        """
        images, labels = self.load_data(subset)
        images, labels = self.preprocess_data(images, labels)
        
        if subset == 'train' and validation_split > 0:
            # Split training data into train and validation
            X_train, X_val, y_train, y_val = train_test_split(
                images, labels, 
                test_size=validation_split, 
                random_state=42,
                stratify=labels.argmax(axis=1)
            )
            return X_train, X_val, y_train, y_val
        
        return images, labels


if __name__ == "__main__":
    # Test the data loader
    dataset_path = "../FER2013"  # Adjust path as needed
    
    loader = FER2013DataLoader(dataset_path)
    
    # Load training data
    X_train, X_val, y_train, y_val = loader.load_and_preprocess('train', validation_split=0.2)
    print(f"\nTraining set: {X_train.shape}")
    print(f"Validation set: {X_val.shape}")
    
    # Load test data
    X_test, y_test = loader.load_and_preprocess('test', validation_split=0)
    print(f"Test set: {X_test.shape}")
    
    print(f"\nEmotion labels: {loader.emotion_labels}")
    print(f"Number of classes: {loader.num_classes}")
