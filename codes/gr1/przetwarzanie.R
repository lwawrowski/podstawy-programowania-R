library(tidyverse)

filmy <- read_csv(file = "data/movies.csv")
summary(filmy)

komedie <- filmy %>%
  filter(genre == "Comedy")

# wiele warunków
filmy2012 <- filmy %>%
  filter(year == 2012, votes > 1000)  

filmy2012 <- filmy %>%
  filter(year == 2012 & votes > 1000)  

filmy2012 <- filmy %>%
  filter(year == 2012) %>%
  filter(votes > 1000)  


# zadanie

filmy_zadanie <- filmy %>%
  filter(genre == "Action" & year > 2010 & (duration > 120 | rating > 8))

filmy_zadanie <- filmy %>%
  filter(genre == "Action", year > 2010, duration > 120 | rating > 8)

filmy_zadanie <- filmy %>%
  filter(genre == "Action" & year > 2010) %>%
  filter(duration > 120 | rating > 8)

# trzy gatunki

filmy3 <- filmy %>%
  filter(genre == "Crime" | genre == "Action" | genre == "Drama")

filmy3 <- filmy %>%
  filter(genre %in% c("Crime", "Action", "Drama"))

# zapisanie do pliku RData
save(filmy, filmy3, file = "data/filmy.RData")

# wczytanie z pliku RData
load("data/filmy.RData")


