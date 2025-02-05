{{- $title := .File.ContentBaseName -}}
{{- $title = replaceRE "^\\d+-" "" $title -}}
{{- $title = replace $title "-" " " -}}
{{- $title = $title | title -}}
+++
type = 'track'
title = '{{ $title }}'
draft = true
weight = 1
+++
