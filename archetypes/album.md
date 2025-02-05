+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = {{ .Date }}
artists = []
description = ''
featured_image = ''
[links]
    bandcamp = ''
    spotify = ''
    apple = ''
    youtube = ''
[[cascade]]
    [cascade.params]
        draft = true
+++
