"""
CNN Model for FER2013 Emotion Recognition
Defines the neural network architecture
"""

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.regularizers import l2


def create_emotion_model(input_shape=(48, 48, 1), num_classes=7):
    """
    Create CNN model for emotion recognition
    
    Architecture:
    - 4 Convolutional blocks with BatchNormalization and MaxPooling
    - 2 Dense layers with Dropout
    - Softmax output layer
    
    Args:
        input_shape: Shape of input images (height, width, channels)
        num_classes: Number of emotion classes
        
    Returns:
        Compiled Keras model
    """
    
    model = models.Sequential([
        # Input layer
        layers.Input(shape=input_shape),
        
        # Block 1
        layers.Conv2D(64, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Conv2D(64, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(0.25),
        
        # Block 2
        layers.Conv2D(128, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Conv2D(128, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(0.25),
        
        # Block 3
        layers.Conv2D(256, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Conv2D(256, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(0.25),
        
        # Block 4
        layers.Conv2D(512, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Conv2D(512, (3, 3), padding='same', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(0.25),
        
        # Flatten and Dense layers
        layers.Flatten(),
        
        layers.Dense(512, kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.5),
        
        layers.Dense(256, kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.5),
        
        # Output layer
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model


def compile_model(model, learning_rate=0.001):
    """
    Compile the model with optimizer and loss function
    
    Args:
        model: Keras model
        learning_rate: Learning rate for optimizer
        
    Returns:
        Compiled model
    """
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def get_callbacks(model_path='models/emotion_model.h5'):
    """
    Get training callbacks
    
    Args:
        model_path: Path to save best model
        
    Returns:
        List of callbacks
    """
    
    callbacks = [
        # Save best model
        tf.keras.callbacks.ModelCheckpoint(
            model_path,
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        
        # Early stopping
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        
        # Reduce learning rate on plateau
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        
        # TensorBoard logging
        tf.keras.callbacks.TensorBoard(
            log_dir='logs',
            histogram_freq=1
        )
    ]
    
    return callbacks


if __name__ == "__main__":
    # Test model creation
    model = create_emotion_model()
    model = compile_model(model)
    
    print("Model created successfully!")
    print("\nModel Summary:")
    model.summary()
    
    print(f"\nTotal parameters: {model.count_params():,}")
