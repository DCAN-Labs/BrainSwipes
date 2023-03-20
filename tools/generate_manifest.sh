bucket="$1"
manifest_file="$2"

s3cmd ls s3://${bucket} | awk '{print $4}' | xargs -n 1 basename > $manifest_file

sed -e 's/$/",/' -i $manifest_file
sed '$ s/.$/]/' -i $manifest_file
sed -e 's/^/"/' -i $manifest_file
sed '1s/^/[/' -i $manifest_file

# EXAMPLE:
# ./generate_manifest.sh swipes_test manifest.json