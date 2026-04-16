"""
Convert TensorFlow model to TensorFlow.js format
For browser-based inference in the frontend
"""

import tensorflowjs as tfjs
import tensorflow as tf
import os


def convert_model_to_tfjs(model_path, output_dir):
    """
    Convert Keras model to TensorFlow.js format
    
    Args:
        model_path: Path to saved Keras model (.h5)
        output_dir: Directory to save TensorFlow.js model
    """
    
    print(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)
    
    print(f"\nModel Summary:")
    model.summary()
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\nConverting model to TensorFlow.js format...")
    tfjs.converters.save_keras_model(model, output_dir)
    
    print(f"\n✓ Model converted successfully!")
    print(f"  Output directory: {output_dir}")
    print(f"\nFiles created:")
    for file in os.listdir(output_dir):
        file_path = os.path.join(output_dir, file)
        size = os.path.getsize(file_path) / 1024  # Size in KB
        print(f"  - {file} ({size:.2f} KB)")
    
    print(f"\nTo use in frontend:")
    print(f"  1. Copy the '{output_dir}' folder to your frontend public directory")
    print(f"  2. Load the model using tf.loadLayersModel()")
    print(f"  3. Example:")
    print(f"     const model = await tf.loadLayersModel('/tfjs_model/model.json');")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert Keras model to TensorFlow.js')
    parser.add_argument('--model', type=str, default='models/emotion_model_best.h5',
                        help='Path to Keras model file')
    parser.add_argument('--output', type=str, default='tfjs_model',
                        help='Output directory for TensorFlow.js model')
    
    args = parser.parse_args()
    
    convert_model_to_tfjs(args.model, args.output)
