/* Find-replace regex syntax for converting ecmascript conformance tests */

- name: (.*)\n  desc: (.*)\n.*\n.*\n  code: \|\n((.|\n)*)@assert pixel (.*) == (.*);\n.*
// \2\nit.only('\1', function() {\n\3\n    _assertPixel(gl, \5, \6);\n});