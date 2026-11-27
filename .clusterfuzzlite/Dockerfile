FROM gcr.io/oss-fuzz-base/base-builder-python:v1@sha256:6ccbb6b02fcbb8e07d15680e933a6d835cdb579636032cec7d256d0f25d483e4
COPY extractAccountAsJson.py $SRC/hiero-solo-action/
COPY .clusterfuzzlite $SRC/hiero-solo-action/.clusterfuzzlite
WORKDIR $SRC/hiero-solo-action
COPY .clusterfuzzlite/build.sh $SRC/build.sh
