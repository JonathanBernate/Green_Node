Coloca aquí el modelo entrenado (formato TFLite) descargado de Colab:

  web/public/model/
  ├── waste_classifier_v1.tflite    (el modelo)
  └── labels.json                   (orden de clases, ej: ["plastic","paper",...])

Ambos archivos se descargan al final del notebook ml/GreenNode_Entrenamiento.ipynb.

Mientras waste_classifier_v1.tflite no exista, la app usa clasificación
simulada automáticamente.

Nota: el modelo actual entrena con 5 clases (sin 'organic', porque TrashNet
no la incluye). labels.json refleja ese orden y el codigo se adapta solo.
