from ultralytics import YOLO
import cv2
import cvzone
import math

# cap = cv2.VideoCapture(0)
# cap.set(3, 1280) #width
# cap.set(4, 720) #height

cap = cv2.VideoCapture("./Videos/ppe-3-1.mp4")

model = YOLO('best.pt')

classNames = ['Fall-Detected', 'Gloves', 'Goggles', 'Hardhat', 'Ladder', 'Mask', 'NO-Gloves', 'NO-Goggles', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 'Person', 'Safety Cone', 'Safety Vest']

while True:
    success, img = cap.read()
    if not success or img is None:
        print("Failed to grab frame")
        break  # or continue
    results = model(img, stream=True)
    for r in results:
        boxes = r.boxes
        for box in boxes:
            #Bounding Box
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            # cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 255), 3)
            w, h = x2 - x1, y2 - y1

            #Confidence
            conf = math.ceil((box.conf[0] * 100)) / 100
            #Class Name
            cls = int(box.cls[0])
            currentClass = classNames[cls]
            print(currentClass)
            
            if currentClass =='NO-Hardhat' or currentClass =='NO-Safety Vest' or currentClass == "NO-Mask":
                myColor = (0, 0,255)
            elif currentClass =='Hardhat' or currentClass =='Safety Vest' or currentClass == "Mask":
                myColor =(0,255,0)
            else:
                myColor = (255, 0, 0)
            
            cv2.rectangle(img, (x1, y1), (x2, y2), myColor, 2)
 
            cvzone.putTextRect(img, f'{classNames[cls]} {conf}',
                                   (max(0, x1), max(35, y1)), scale=1, thickness=1,colorB=myColor,
                                   colorT=(0,0,0),colorR=myColor, offset=5)


    cv2.imshow("Image", img)
    cv2.waitKey(1)

