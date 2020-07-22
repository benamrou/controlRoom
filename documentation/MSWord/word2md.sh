pandoc -t gfm --extract-media . -o $(basename $1 | cut -d. -f1).md  $1
