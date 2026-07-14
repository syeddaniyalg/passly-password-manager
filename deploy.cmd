@echo off
cd deployment
kubectl apply -f .
cd frontend
kubectl apply -f .
cd ../backend
kubectl apply -f .
timeout /t 5