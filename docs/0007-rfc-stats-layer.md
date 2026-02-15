# RFC 0007: Stats Computation Layer

## Raw Input Data : Practice logs

group:word
  success count
  error count
  start
  end

group
  sesssions count (unfinished too)
  full sessions count (each word succeeded in the group)
  start
  end

## Computed Stats Output

dataset
  groups count
  words count
  unique chars count

per practice type (stroke, pinyin, merged)
  practiced count
  progress (0-100)
  mastery (0-100)

per group × practice type
  progress (0-100)
  mastery (0-100)

per char
  word count (how many words contain this char)
  stroke { success count, error count }
  pinyin { success count, error count }
  last practiced
  practiced (bool)

practiced words list
  sorted by last practiced desc

practiced groups list
  sorted by last practiced desc

chart (30 days)
  daily bars { date, count }
  cumulative unique words line

