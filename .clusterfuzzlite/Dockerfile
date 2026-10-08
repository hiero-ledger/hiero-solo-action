FROM gcr.io/oss-fuzz-base/base-builder-python:v1@sha256:f606cee856c34585c314af4fbc41940bce398f5244fbfc757116188828f473c6
COPY extractAccountAsJson.py $SRC/hiero-solo-action/
COPY .clusterfuzzlite $SRC/hiero-solo-action/.clusterfuzzlite
WORKDIR $SRC/hiero-solo-action
COPY .clusterfuzzlite/build.sh $SRC/build.sh
