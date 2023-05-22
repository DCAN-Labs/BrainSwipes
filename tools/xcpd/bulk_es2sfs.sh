#!/bin/bash
img_dir="$1"
output_dir="${img_dir}/converted/"
echo "${output_dir}"

for img in `ls ${img_dir}/*.png`; do
    echo "${img}"
    ./es2sfs_img_converter.py -i ${img} -o ${output_dir}
done

# EXAMPLE:
# ./bulk_es2sfs.sh swipes-img