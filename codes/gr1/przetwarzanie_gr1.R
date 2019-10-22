library(tidyverse)

filmy <- read_csv(file = "data/movies.csv")
summary(filmy)

komedie <- filmy %>%
  filter(genre == "Comedy")

filmy2012 <- filmy %>% 
  filter(year == 2012, votes < 10000)

filmy2012 <- filmy %>% 
  filter(year == 2012 & votes < 10000)

# zadanie

filmy_zadanie <- filmy %>%
  filter(genre == "Action" & year > 2010 & (duration > 120 | rating > 8))

filmy_zadanie <- filmy %>%
  filter(genre == "Action", year > 2010, duration > 120 | rating > 8)

filmy_zadanie <- filmy %>%
  filter(genre == "Action" & year > 2010) %>% 
  filter(duration > 120 | rating > 8)

# 3 gatunki
filmy3 <- filmy %>% 
  filter(genre == "Action" | genre == "Crime" | genre == "Drama")

filmy3 <- filmy %>%
  filter(genre %in% c("Action", "Crime", "Drama"))

save(filmy, filmy3, file = "data/filmy.RData")

load("data/filmy.RData")

is.na(5)
is.na(NA)

1/0 # Inf
sqrt(-1) #NaN
NULL

complete.cases(filmy)

load("data/pgss.RData")

summary(pgss)

pgss_nona_q34 <- pgss %>% 
  filter(!is.na(q34))

summary(pgss_nona_q34)

# zero braków
complete.cases(pgss)

pgss_nona <- pgss %>% 
  filter(complete.cases(pgss))

summary(pgss_nona)

pgss_nona <- pgss %>%
  filter_all(all_vars(!is.na(.)))

# wybieranie kolumn

# nie działa
filmy3 <- filmy %>%
  select(title, year) %>%
  filter(genre %in% c("Action", "Crime", "Drama"))

# działa
filmy3 <- filmy %>%
  filter(genre %in% c("Action", "Crime", "Drama")) %>% 
  select(title, year) %>%
  rename(tytul=title, rok=year)

filmy <- filmy %>%
  mutate(dur_hour=duration/60,
         age=2019-year)

# podsumowanie

filmy %>% 
  as_tibble() %>%
  summarise(srednia_ocena=mean(rating),
            mediana_ocena=median(rating),
            liczebnosc=n())

stats_genre <- filmy %>% 
  group_by(genre) %>%
  summarise(srednia=mean(duration),
            mediana=median(duration),
            odchylenie=sd(duration))
  
filmy %>%
  group_by(genre) %>%
  summarise(liczebnosc=n())

filmy %>%
  count(genre)

# zadanie

filmy %>% 
  filter(year >= 2000, year <= 2010) %>%
  group_by(year) %>%
  summarise(liczba=n(),
            srednia=mean(rating))














