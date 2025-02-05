+++
type = 'credit'
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
draft = true
date = {{ .Date }}
artists = ['{{ .File.ContentBaseName }}']
roles = []
locations = []
+++
