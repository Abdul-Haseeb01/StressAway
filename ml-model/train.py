"""
Training Script for FER2013 Emotion Recognition Model
"""

import os
import argparse
import numpy as np
import matplotlib.pyplot as plt
from data_loader import FER2013DataLoader
from model import create_emotion_model, compile_model, get_callbacks


def plot_training_history(history, save_path='training_history.png'):
    """
    Plot training history
    
    Args:
        history: Keras training history object
        save_path: Path to save the plot
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
    
    # Plot accuracy
    ax1.plot(history.history['accuracy'], label='Train Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Val Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)
    
    # Plot loss
    ax2.plot(history.history['loss'], label='Train Loss')
    ax2.plot(history.history['val_loss'], label='Val Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path)
    print(f"Training history plot saved to {save_path}")


def train_model(dataset_path, epochs=50, batch_size=64, learning_rate=0.001):
    """
    Train the emotion recognition model
    
    Args:
        dataset_path: Path to FER2013 dataset
        epochs: Number of training epochs
        batch_size: Batch size for training
        learning_rate: Learning rate for optimizer
    """
    
    # Create directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    print("="*50)
    print("FER2013 Emotion Recognition Model Training")
    print("="*50)
    
    # Load data
    print("\n1. Loading and preprocessing data...")
    loader = FER2013DataLoader(dataset_path)
    
    X_train, X_val, y_train, y_val = loader.load_and_preprocess('train', validation_split=0.2)
    X_test, y_test = loader.load_and_preprocess('test', validation_split=0)
    
    print(f"\nDataset shapes:")
    print(f"  Training: {X_train.shape}")
    print(f"  Validation: {X_val.shape}")
    print(f"  Test: {X_test.shape}")
    
    # Create model
    print("\n2. Creating model...")
    model = create_emotion_model(
        input_shape=(48, 48, 1),
        num_classes=loader.num_classes
    )
    model = compile_model(model, learning_rate=learning_rate)
    
    print("\nModel Summary:")
    model.summary()
    
    # Get callbacks
    callbacks = get_callbacks(model_path='models/emotion_model_best.h5')
    
    # Train model
    print("\n3. Training model...")
    print(f"  Epochs: {epochs}")
    print(f"  Batch size: {batch_size}")
    print(f"  Learning rate: {learning_rate}")
    
    history = model.fit(
        X_train, y_train,
        batch_size=batch_size,
        epochs=epochs,
        validation_data=(X_val, y_val),
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate on test set
    print("\n4. Evaluating on test set...")
    test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"  Test Loss: {test_loss:.4f}")
    print(f"  Test Accuracy: {test_accuracy:.4f}")
    
    # Save final model
    final_model_path = 'models/emotion_model_final.h5'
    model.save(final_model_path)
    print(f"\n5. Final model saved to {final_model_path}")
    
    # Plot training history
    plot_training_history(history, 'models/training_history.png')
    
    # Print class-wise accuracy
    print("\n6. Class-wise performance:")
    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_true_classes = np.argmax(y_test, axis=1)
    
    for i, emotion in enumerate(loader.emotion_labels):
        mask = y_true_classes == i
        if mask.sum() > 0:
            accuracy = (y_pred_classes[mask] == i).sum() / mask.sum()
            print(f"  {emotion}: {accuracy:.4f} ({mask.sum()} samples)")
    
    print("\n" + "="*50)
    print("Training completed!")
    print("="*50)
    
    return model, history


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train FER2013 emotion recognition model')
    parser.add_argument('--dataset-path', type=str, default='../FER2013',
                        help='Path to FER2013 dataset directory')
    parser.add_argument('--epochs', type=int, default=30,
                        help='Number of training epochs (default: 30)')
    parser.add_argument('--batch-size', type=int, default=64,
                        help='Batch size (default: 64)')
    parser.add_argument('--learning-rate', type=float, default=0.001,
                        help='Learning rate (default: 0.001)')
    
    args = parser.parse_args()
    
    # Train model
    model, history = train_model(
        dataset_path=args.dataset_path,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate
    )
