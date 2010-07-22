ARGF.each_line do |line|
  line.gsub! /public function (\w+)/, 'var \1 = exports.\1 = function \1'
  line.gsub! /private function (\w+)/, 'var \1 = function \1'
  line.gsub! /public class (\w+)/, '\1 = function()'
  line.gsub! /private static /, '/*private_static*/ '
  line.gsub! /private /, '/*private*/ '
  line.gsub! /protected /, '/*protected*/ '
  line.gsub! /import/, '//import'
  line.gsub! /function get /, 'function '
  line.gsub! /\:([A-Za-z\*]+)/, '/*\1*/'
  puts line
end
