Conformance tests retrieved from:
https://github.com/w3c/web-platform-tests/blob/master/2dcontext/tools/tests2d.yaml

/* Find-replace regex syntax for converting ecmascript conformance tests */

- name: (.*)\n  desc: (.*)\n.*\n.*\n  code: \|\n((.|\n)*)@assert pixel (.*) == (.*);\n.*
// \2\nit.only('\1', function() {\n\3\n    _assertPixel(gl, \5, \6);\n});