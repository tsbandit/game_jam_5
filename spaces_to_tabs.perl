use strict;
use warnings;

while(my $line = <>) {
  my $n = 0;
  while($line =~ s/^  //) {
    ++$n;
  }
  for(; $n > 0; --$n) {
    print("\t");
  }
  print($line);
}
