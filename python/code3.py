import csv
import json
import argparse
from collections import defaultdict
from tabulate import tabulate
import random

def get_available_rooms(course_type):
    rooms = {
        'Theory': ['Room 101', 'Room 102', 'Room 103'],
        'Computer Lab': ['Computer Lab 201', 'Computer Lab 203', 'Computer Lab 302'],
        'Circuit Lab': ['Circuit Lab 157']
    }
    return rooms.get(course_type, [])

def map_times(preferred_times):
    time_mapping = {
        'Morning': ['Morning 1', 'Morning 2'],
        'Afternoon': ['Afternoon 1', 'Afternoon 2'],
        'Noon': ['Noon 1', 'Noon 2']
    }
    mapped_times = []
    for time in preferred_times.split(','):
        mapped_times.extend(time_mapping.get(time.strip(), [time.strip()]))
    return mapped_times

def parse_course(course):
    try:
        course_name, details = course.split('(')
        course_type = details.split(')')[0].strip()
        course_year = details.split(')')[1].strip() if ')' in details else 'All'
        return course_name.strip(), course_type, course_year
    except ValueError:
        return None, None, None

def read_teachers_from_csv(file_path):
    teachers = []
    with open(file_path, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        for row in reader:
            teachers.append({
                'name': row['teacher_name'],
                'courses': row['courses'].split(','),
                'preferred_days': row['preferred_days'].split(','),
                'preferred_times': row['preferred_times']
            })
    return teachers

def initialize_schedule():
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    time_slots = ['Morning 1', 'Morning 2', 'Noon 1', 'Noon 2', 'Afternoon 1', 'Afternoon 2']
    years = ['1st year', '2nd year', '3rd year', '4th year', 'Masters']

    schedule = {day: {time: {year: [] for year in years} for time in time_slots} for day in days}
    return schedule

def allocate_courses(teachers, schedule):
    valid_days = set(schedule.keys())
    theory_count = defaultdict(lambda: defaultdict(int))  # Track theory classes per day and year
    lab_count = defaultdict(lambda: defaultdict(int))  # Track lab classes per day and year
    room_occupancy = {day: {time: set() for time in schedule[day].keys()} for day in valid_days}
    teacher_schedule = defaultdict(lambda: {day: {time: False for time in schedule[day].keys()} for day in valid_days})
    year_schedule = defaultdict(lambda: {time: set() for time in schedule[next(iter(valid_days))].keys()})

    # Initialize teacher courses list
    lab_courses = defaultdict(list)

    for teacher in teachers:
        for course in teacher['courses']:
            course_name, course_type, course_year = parse_course(course)
            if not course_name:
                continue

            if course_type in ['Computer Lab', 'Circuit Lab']:
                lab_courses[course_type].append({
                    'teacher': teacher['name'],
                    'course': course_name,
                    'year': course_year,
                    'preferred_days': teacher['preferred_days'],
                    'preferred_times': map_times(teacher['preferred_times'])
                })
            else:
                for day in teacher['preferred_days']:
                    if day not in valid_days:
                        continue

                    for time in map_times(teacher['preferred_times']):
                        # Check if the teacher is already scheduled for this time slot
                        if teacher_schedule[teacher['name']][day][time]:
                            continue  # Skip if the teacher is already scheduled for this time

                        # Ensure the time slot is initialized
                        if course_year in year_schedule[day][time]:
                            continue  # Skip if the year already has a class scheduled at this time

                        rooms_in_use = room_occupancy[day][time]
                        available_for_this_time = [room for room in get_available_rooms(course_type) if room not in rooms_in_use]

                        if not available_for_this_time:
                            continue

                        room = available_for_this_time[0]

                        if course_type == 'Theory':
                            if course_year not in schedule[day][time]:
                                schedule[day][time][course_year] = []

                            if len(schedule[day][time][course_year]) == 0:
                                schedule[day][time][course_year].append({
                                    'teacher': teacher['name'],
                                    'course': course_name,
                                    'year': course_year,
                                    'room': room
                                })
                                theory_count[day][course_year] += 1
                                room_occupancy[day][time].add(room)
                                teacher_schedule[teacher['name']][day][time] = True
                                year_schedule[day][time].add(course_year)
                                break

    # Ensure at least two theory classes are scheduled each week for each year
    for day in valid_days:
        for year in ['1st year', '2nd year', '3rd year', '4th year', 'Masters']:
            if theory_count[day][year] < 2:
                needed_classes = 2 - theory_count[day][year]
                available_teachers = [teacher for teacher in teachers if any(course.split('[')[0].split('(')[0].strip() == 'Theory' for course in teacher['courses'])]

                for _ in range(needed_classes):
                    for teacher in available_teachers:
                        for time in schedule[day].keys():
                            if year not in schedule[day][time]:
                                schedule[day][time][year] = []

                            if len(schedule[day][time][year]) == 0:
                                available_rooms = get_available_rooms('Theory')
                                available_rooms = [room for room in available_rooms if room not in room_occupancy[day][time]]
                                if available_rooms:
                                    room = available_rooms[0]  # Assign any available room
                                    schedule[day][time][year].append({
                                        'teacher': teacher['name'],
                                        'course': 'Additional Theory Course',
                                        'year': year,
                                        'room': room
                                    })
                                    theory_count[day][year] += 1
                                    room_occupancy[day][time].add(room)
                                    year_schedule[day][time].add(year)
                                    break
                            if theory_count[day][year] >= 2:
                                break
                        if theory_count[day][year] >= 2:
                            break

    # Allocate lab classes
    for course_type, labs in lab_courses.items():
        for lab in labs:
            for day in lab['preferred_days']:
                if day not in valid_days:
                    continue

                for time in lab['preferred_times']:
                    # Check if the teacher is already scheduled for this time slot
                    if teacher_schedule[lab['teacher']][day][time]:
                        continue  # Skip if the teacher is already scheduled for this time

                    # Ensure the time slot is initialized
                    if lab['year'] not in schedule[day][time]:
                        schedule[day][time][lab['year']] = []

                    if len(schedule[day][time][lab['year']]) == 0:
                        available_rooms = get_available_rooms(course_type)
                        available_rooms = [room for room in available_rooms if room not in room_occupancy[day][time]]
                        
                        if available_rooms:
                            room = random.choice(available_rooms)  # Randomly choose an available room

                            # Schedule the lab class
                            schedule[day][time][lab['year']].append({
                                'teacher': lab['teacher'],
                                'course': f'{lab["course"]} in {room}',
                                'year': lab['year'],
                                'room': room
                            })

                            room_occupancy[day][time].add(room)
                            lab_count[day][lab['year']] += 1
                            year_schedule[day][time].add(lab['year'])
                            teacher_schedule[lab['teacher']][day][time] = True
                            break

    return schedule

def print_schedule(schedule):
    headers = ['Day', 'Time Slot', 'Year', 'Teacher', 'Course', 'Room']
    table_data = []

    for day, times in schedule.items():
        for time, years in times.items():
            for year, classes in years.items():
                for course in classes:
                    row = [day, time, year, course['teacher'], course['course'], course['room']]
                    table_data.append(row)

    print(tabulate(table_data, headers=headers, tablefmt='grid'))

def main():
    parser = argparse.ArgumentParser(description="Generate a course schedule from a CSV file.")
    parser.add_argument('csv_file', type=str, help="Path to the CSV file with teacher data.")
    args = parser.parse_args()

    teachers = read_teachers_from_csv(args.csv_file)
    schedule = initialize_schedule()
    schedule = allocate_courses(teachers, schedule)
    print_schedule(schedule)
    return(schedule)

if __name__ == "__main__":
    main()
