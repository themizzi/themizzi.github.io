+++
type = 'credit'
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = {{ .Date }}
draft = true
artists = ['{{ .File.ContentBaseName }}']
roles = []
locations = []
+++
