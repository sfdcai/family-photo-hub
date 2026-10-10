#!/bin/sh
# Builds app-debug.apk using Docker (no Android Studio needed).
set -e
cd "$(dirname "$0")"
docker run --rm -v "$PWD":/project -w /project cimg/android:2024.10 \
  bash -c "gradle --no-daemon assembleDebug && cp app/build/outputs/apk/debug/app-debug.apk /project/FamilyFrame.apk"
echo "Done: android/FamilyFrame.apk — copy it to the frame and install (allow unknown sources)."
