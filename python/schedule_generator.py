import sys
import csv
import json
import random
from deap import base, creator, tools, algorithms

# Constants
NUM_ROOMS = 3
NUM_COMP_LABS = 2
NUM_CIRC_LABS = 1
NUM_DAYS = 5
NUM_TIMESLOTS = 6

days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
times = ["Morning 1", "Morning 2", "Noon 1", "Noon 2", "Afternoon 1", "Afternoon 2"]
years = ["1st year", "2nd year", "3rd year", "4th year"]

# Function to read the CSV file
def read_teachers_from_csv(csv_file_path):
    teachers = []
    courses = []
    preferences = []
    classroom_types = []
    course_years = []

    with open(csv_file_path, mode='r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            teacher_name = row['teacher_name']
            teachers.append(teacher_name)

            preferred_days = row['preferred_days'].split(',')
            preferred_times = row['preferred_times'].split(',')
            preferences.append((
                [day.strip() for day in preferred_days if day.strip() in days],
                [time.strip() for time in preferred_times if time.strip() in times]
            ))

            if row['courses']:
                course_list = row['courses'].split(',')
                for course in course_list:
                    course_info = course.strip()
                    if '(' in course_info and ')' in course_info and '[' in course_info and ']' in course_info:
                        course_name, rest = course_info.rsplit('(', 1)
                        class_type, year = rest.split('[')
                        classroom_types.append(class_type.strip(')'))
                        course_years.append(year.strip(']'))
                        courses.append(course_name.strip())
                    else:
                        courses.append(course_info.strip())
                        classroom_types.append("Theory")
                        course_years.append("1st year")
            else:
                print(f"No courses found for teacher: {teacher_name}")

    return teachers, courses, preferences, classroom_types, course_years

csv_file_path = sys.argv[1]
teachers, courses, preferences, classroom_types, course_years = read_teachers_from_csv(csv_file_path)

def preference_to_indices(preferred_days, preferred_times):
    day_indices = [i for i, day in enumerate(days) if day in preferred_days]
    time_indices = [i for i, time in enumerate(times) if time in preferred_times]
    return day_indices, time_indices

def evaluate(individual):
    # Ensure the individual has the expected structure
    if not isinstance(individual, list) or any(not isinstance(ind, list) or len(ind) != 4 for ind in individual):
        print(f"Invalid individual structure: {individual}")
        return (float('inf'),)  # Assign a high penalty for invalid individuals

    fitness = 0

    # Check for room assignments
    for day in range(NUM_DAYS):
        for timeslot in range(NUM_TIMESLOTS):
            rooms_used = [ind[2] for ind in individual if ind[0] == day and ind[1] == timeslot]
            if len(set(rooms_used)) != len(rooms_used):  # Room double booking
                fitness -= 10

    # Validate room assignments based on course types
    for course in range(len(courses)):
        day, timeslot, room, teacher = individual[course]
        class_type = classroom_types[course]
        if class_type == "Theory" and room >= NUM_ROOMS:
            fitness -= 5
        elif class_type == "Computer Lab" and (room < NUM_ROOMS or room >= NUM_ROOMS + NUM_COMP_LABS):
            fitness -= 10
        elif class_type == "Circuit Lab" and room != NUM_ROOMS + NUM_COMP_LABS:
            fitness -= 15

    # Evaluate preferences for each teacher
    for course in range(len(courses)):
        day, timeslot, room, teacher = individual[course]
        preferred_days, preferred_times = preferences[teacher]
        preferred_day_indices, preferred_timeslot_indices = preference_to_indices(preferred_days, preferred_times)
        
        if day not in preferred_day_indices or timeslot not in preferred_timeslot_indices:
            fitness -= 5

        # Additional check for year consistency
        course_year = course_years[course]
        if course_year not in years:
            fitness -= 10  # Penalize if the course year is invalid

    return (fitness,)

# Genetic algorithm setup
creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

toolbox = base.Toolbox()
toolbox.register("day", random.randint, 0, NUM_DAYS - 1)
toolbox.register("timeslot", random.randint, 0, NUM_TIMESLOTS - 1)
toolbox.register("room", random.randint, 0, NUM_ROOMS + NUM_COMP_LABS + NUM_CIRC_LABS - 1)
toolbox.register("teacher", random.randint, 0, len(teachers) - 1)

# Generate courses as a list of [day, timeslot, room, teacher]
def generate_course():
    return [toolbox.day(), toolbox.timeslot(), toolbox.room(), toolbox.teacher()]

toolbox.register("course", generate_course)
toolbox.register("individual", tools.initRepeat, creator.Individual, toolbox.course, n=len(courses))
toolbox.register("population", tools.initRepeat, list, toolbox.individual)

toolbox.register("mate", tools.cxTwoPoint)
toolbox.register("mutate", tools.mutUniformInt, 
    low=[0] * len(courses) * 4, 
    up=[NUM_DAYS - 1] * len(courses) + 
        [NUM_TIMESLOTS - 1] * len(courses) + 
        [NUM_ROOMS + NUM_COMP_LABS + NUM_CIRC_LABS - 1] * len(courses) + 
        [len(teachers) - 1] * len(courses), 
    indpb=0.1)
toolbox.register("select", tools.selTournament, tournsize=3)
toolbox.register("evaluate", evaluate)

def main():
    random.seed(42)
    pop = toolbox.population(n=300)
    hof = tools.HallOfFame(1)
    stats = tools.Statistics(lambda ind: ind.fitness.values[0])
    stats.register("avg", lambda values: sum(values) / len(values))
    stats.register("min", min)
    stats.register("max", max)
    algorithms.eaSimple(pop, toolbox, cxpb=0.5, mutpb=0.2, ngen=40, stats=stats, halloffame=hof, verbose=True)
    return pop, stats, hof

# Suppress DEAP output
import io
import contextlib

def suppress_deap_output(func, *args, **kwargs):
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return func(*args, **kwargs)

population, statistics, hall_of_fame = suppress_deap_output(main)
best_schedule = hall_of_fame[0]

# Initialize the schedule dictionary
schedule = {day: {year: {timeslot: [] for timeslot in times} for year in years} for day in days}

# Populate the schedule based on the best schedule
for course in range(len(courses)):
    item = best_schedule[course]
    if isinstance(item, (list, tuple)) and len(item) == 4:
        day, timeslot, room, teacher = item
        if room < NUM_ROOMS:
            room_type = "Classroom"
            room_number = 101 + room  # Room numbers 101, 102, 103
        elif room < NUM_ROOMS + NUM_COMP_LABS:
            room_type = "Computer Lab"
            room_number = 203 + (room - NUM_ROOMS) * 99  # Lab numbers 203, 302
        else:
            room_type = "Circuit Lab"
            room_number = 157  # Circuit Lab number 157

        course_info = {
            "course": courses[course],
            "teacher": teachers[teacher],
            "room_type": room_type,
            "room_number": room_number
        }
        year = course_years[course]  # Get the year for the course

        if year in years:
            # Assign course to the schedule for the correct day, year, and timeslot
            schedule[days[day]][year][times[timeslot]].append(course_info)

# Filter to include only the desired days
desired_days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
filtered_schedule = {day: schedule[day] for day in desired_days}

print(json.dumps(filtered_schedule, indent=2))
