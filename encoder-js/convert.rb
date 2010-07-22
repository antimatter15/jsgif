ARGF.each_line do |line|
  line.gsub! /public function (\w+)/, 'exports.\1 = function \1'
  line.gsub! /public class (\w+)/, '\1 = function()'
  line.gsub! /private /, '/*private*/ '
  line.gsub! /import/, '//import'
  line.gsub! /\:([A-Za-z]+)/, '/*\1*/'
  puts line
end
