FROM gcr.io/oss-fuzz-base/base-builder-python@sha256:aa1326f311d899ed3ca050a89b6c1e3528e2aa86be1ce5180aaddf3567547a99
COPY extractAccountAsJson.py $SRC/hiero-solo-action/
COPY .clusterfuzzlite $SRC/hiero-solo-action/.clusterfuzzlite
WORKDIR $SRC/hiero-solo-action
COPY .clusterfuzzlite/build.sh $SRC/build.sh
