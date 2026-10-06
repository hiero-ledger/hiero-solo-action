FROM gcr.io/oss-fuzz-base/base-builder-python:v1@sha256:b02a06f9d3918428825b1ebfa2c3627b591a5924a83436b8aaec40c85fd15b16
COPY extractAccountAsJson.py $SRC/hiero-solo-action/
COPY .clusterfuzzlite $SRC/hiero-solo-action/.clusterfuzzlite
WORKDIR $SRC/hiero-solo-action
COPY .clusterfuzzlite/build.sh $SRC/build.sh
