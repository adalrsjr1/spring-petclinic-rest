#!/bin/bash

set -ex

NAMESPACE="${NAMESPACE:-petclinic}"

RATE="${RATE:-1}"  # each K6 iteration results into 12 requests (12req/it)
CLIENTS="${CLIENTS:-1}"
DURATION="${DURATION:-1m}"
SCENARIO="${SCENARIO:-rt}"

JOB_NAME="k6-petclinic-$(date +%s)-${SCENARIO}-d${DURATION}-c${CLIENTS}-r${RATE}"

kubectl create configmap load-script --from-file=load.js -n "$NAMESPACE" || true

# Create Job using the unique name
kubectl create -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: "$JOB_NAME"
  namespace: "$NAMESPACE"
spec:
  template:
    spec:
      containers:
      - name: k6
        image: grafana/k6:latest
        imagePullPolicy: IfNotPresent
        env:
        - name: SCENARIO  # rt (constant-arrival-rate) or rps (constant-vus)
          value: "${SCENARIO}"
        - name: K6_NO_VU_CONNECTION_REUSE
          value: "true"
        - name: K6_NO_CONNECTION_REUSE
          value: "true"
        - name: DURATION
          value: "${DURATION}"
        - name: RATE
          value: "${RATE}" # Set your desired request rate
        - name: BASE_URL
          value: "http://petclinic.petclinic:9966/petclinic" # Set your target host
        args: ["run", "/app/load.js", "--quiet"]
        volumeMounts:
        - name: config-volume
          mountPath: /app
      restartPolicy: Never
      volumes:
      - name: config-volume
        configMap:
          name: load-script
  backoffLimit: 0
EOF

