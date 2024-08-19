import csv
import os
from collections import defaultdict
from tabulate import tabulate

def parse_csv(file_path):
    teachers = []
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No such file or directory: '{file_path}'")
    
    with open(file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            teacher = {
                'name': row['teacher_name'],
                'preferred_days': row['preferred_days'].split(','),
                'preferred_times': row['preferred_times'].split(','),
                'courses': row['courses'].split(',')
            }
            teachers.append(teacher)
    return teachers

def initialize_schedule():
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    times = ['Morning 1', 'Morning 2', 'Noon 1', 'Noon 2', 'Afternoon 1', 'Afternoon 2']
    schedule = {day: {time: defaultdict(list) for time in times} for day in days}
    return schedule

def get_available_rooms(course_type):
    room_types = {
        'Theory': ['Theory Room 101', 'Theory Room 102', 'Theory Room 103'],
        'Computer Lab': ['Computer Lab 202', 'Computer Lab 203', 'Computer Lab 302'],
        'Circuit Lab': ['Circuit Lab 157']
    }
    return room_types.get(course_type, [])

def allocate_courses(teachers, schedule):
    valid_days = set(schedule.keys())
    theory_count = defaultdict(int)
    
    # Keep track of room occupancy per day and time slot
    room_occupancy = {day: {time: set() for time in schedule[day].keys()} for day in valid_days}

    for teacher in teachers:
        teacher_schedule = {day: {time: False for time in schedule[day].keys()} for day in valid_days}
        
        for course in teacher['courses']:
            course_name, course_details = course.split('[')
            course_type, course_year = course_name.split('(')[1].strip(')'), course_details.strip(']')
            available_rooms = get_available_rooms(course_type)
            
            for day in teacher['preferred_days']:
                if day not in valid_days:
                    continue
                
                for time in teacher['preferred_times']:
                    if teacher_schedule[day][time]:
                        continue  # Skip if the teacher is already assigned at this time
                    
                    # Get the list of rooms currently in use
                    rooms_in_use = room_occupancy[day][time]
                    
                    # Filter available rooms based on current usage
                    available_for_this_time = [room for room in available_rooms if room not in rooms_in_use]
                    
                    if not available_for_this_time:
                        continue
                    
                    room = available_for_this_time[0]  # Pick the first available room
                    
                    if course_type in ['Computer Lab', 'Circuit Lab']:
                        # Ensure both time slots are available
                        next_time = None
                        if time == 'Morning 1':
                            next_time = 'Morning 2'
                        elif time == 'Morning 2':
                            next_time = 'Noon 1'
                        elif time == 'Noon 1':
                            next_time = 'Noon 2'
                        elif time == 'Noon 2':
                            next_time = 'Afternoon 1'
                        elif time == 'Afternoon 1':
                            next_time = 'Afternoon 2'
                        
                        if next_time and len(schedule[day][next_time][course_year]) == 0:
                            if len(schedule[day][time][course_year]) == 0:
                                schedule[day][time][course_year].append({
                                    'teacher': teacher['name'],
                                    'course': course_name.strip(),
                                    'year': course_year,
                                    'room': room,
                                    'time': f"{time}+{next_time}"
                                })
                                schedule[day][next_time][course_year].append({
                                    'teacher': teacher['name'],
                                    'course': course_name.strip(),
                                    'year': course_year,
                                    'room': room
                                })
                                # Update room occupancy
                                room_occupancy[day][time].add(room)
                                room_occupancy[day][next_time].add(room)
                                teacher_schedule[day][time] = True
                                teacher_schedule[day][next_time] = True
                                break
                    else:
                        if len(schedule[day][time][course_year]) == 0:
                            # Allocate room to theory classes
                            if course_type == 'Theory':
                                # Check if the room is already allocated for this time slot
                                if all(course['room'] != room for course in schedule[day][time][course_year]):
                                    schedule[day][time][course_year].append({
                                        'teacher': teacher['name'],
                                        'course': course_name.strip(),
                                        'year': course_year,
                                        'room': room
                                    })
                                    theory_count[day] += 1
                                    # Update room occupancy
                                    room_occupancy[day][time].add(room)
                                    teacher_schedule[day][time] = True
                                    break  # Move to the next course after scheduling one instance
    
    # Ensure at least two theory classes per week
    for day in valid_days:
        if theory_count[day] < 2:
            # Add additional theory classes if needed
            needed_classes = 2 - theory_count[day]
            for _ in range(needed_classes):
                for teacher in teachers:
                    if any(course.split('[')[0].split('(')[0].strip() == 'Theory' for course in teacher['courses']):
                        for time in schedule[day].keys():
                            if len(schedule[day][time]['All']) == 0:
                                available_rooms = get_available_rooms('Theory')
                                for room in available_rooms:
                                    if room not in room_occupancy[day][time]:
                                        schedule[day][time]['All'].append({
                                            'teacher': teacher['name'],
                                            'course': 'Additional Theory Course',
                                            'year': 'All',
                                            'room': room
                                        })
                                        theory_count[day] += 1
                                        # Update room occupancy
                                        room_occupancy[day][time].add(room)
                                        break
                            if theory_count[day] >= 2:
                                break
    
    # Ensure at least one lab class per lab type per week
    lab_rooms = ['Computer Lab 203', 'Computer Lab 302', 'Circuit Lab 157']
    scheduled_lab_rooms = {room: False for room in lab_rooms}

    for day in valid_days:
        for time in ['Morning 1', 'Noon 1', 'Afternoon 1']:
            next_time = f"{time.split()[0]} 2"
            for room in lab_rooms:
                if not scheduled_lab_rooms[room]:
                    if room not in room_occupancy[day][time]:
                        if len(schedule[day][time]['All']) == 0 and len(schedule[day].get(next_time, {}).get('All', [])) == 0:
                            schedule[day][time]['All'].append({
                                'teacher': 'Lab Assistant',
                                'course': 'Lab Class',
                                'year': 'All',
                                'room': room,
                                'time': f"{time}+{next_time}"
                            })
                            schedule[day][next_time]['All'].append({
                                'teacher': 'Lab Assistant',
                                'course': 'Lab Class',
                                'year': 'All',
                                'room': room
                            })
                            scheduled_lab_rooms[room] = True
                            # Update room occupancy
                            room_occupancy[day][time].add(room)
                            room_occupancy[day][next_time].add(room)
                            break
            if any(scheduled_lab_rooms.values()):
                break

    return schedule

def resolve_conflicts(schedule):
    # Create a dictionary to track room usage per time slot
    room_usage = defaultdict(lambda: defaultdict(set))
    
    # Fill room usage data
    for day, times in schedule.items():
        for time, courses_by_year in times.items():
            for year, courses in courses_by_year.items():
                for course in courses:
                    room_usage[day][time].add(course['room'])

    for day, times in schedule.items():
        for time, courses_by_year in times.items():
            for year, courses in courses_by_year.items():
                if len(courses) > 1:
                    # Handle conflicts by moving courses to available rooms or different time slots
                    for course in courses[1:]:  # Skip the first course
                        original_room = course['room']
                        course_type = course['course'].split('(')[1].strip(')')
                        available_rooms = get_available_rooms(course_type)
                        
                        # Determine rooms occupied in the current time slot
                        occupied_rooms_current = room_usage[day][time]
                        
                        # Remove rooms that are already occupied in the current time slot
                        available_rooms_for_current = [room for room in available_rooms if room not in occupied_rooms_current]
                        
                        if available_rooms_for_current:
                            # Try to move the course to an available room in the current time slot
                            new_room = available_rooms_for_current[0]
                            course.update({'room': new_room, 'time': time})
                            room_usage[day][time].add(new_room)
                            # Remove the original course from the conflict list
                            courses.remove(course)
                            continue
                        
                        # If no available rooms in the current time slot, check for future time slots
                        available_rooms_for_future = [room for room in available_rooms if room not in occupied_rooms_current]
                        
                        moved = False
                        for new_time in schedule[day]:
                            if new_time != time:
                                # Check room availability for the new time slot
                                new_occupied_rooms = room_usage[day][new_time]
                                available_rooms_for_future_slot = [room for room in get_available_rooms(course_type) if room not in new_occupied_rooms]
                                
                                if available_rooms_for_future_slot:
                                    new_room = available_rooms_for_future_slot[0]
                                    course.update({'room': new_room, 'time': new_time})
                                    room_usage[day][new_time].add(new_room)
                                    # Remove the original course from the conflict list
                                    courses.remove(course)
                                    moved = True
                                    break
                            if moved:
                                break
                        
                        if not moved:
                            # If no valid room or time found, just remove the conflicting course (you might want to handle this differently)
                            courses.remove(course)

    return schedule

def print_schedule(schedule):
    table_data = []
    headers = ['Day', 'Time', 'Year', 'Course', 'Teacher', 'Room', 'Additional Info']
    
    for day, times in schedule.items():
        for time, courses_by_year in times.items():
            for year, courses in courses_by_year.items():
                for course in courses:
                    additional_info = course.get('time', '')
                    table_data.append([
                        day,
                        time,
                        year,
                        course['course'],
                        course['teacher'],
                        course['room'],
                        additional_info
                    ])

    print(tabulate(table_data, headers=headers, tablefmt='grid'))

# Example usage
file_path = 'uploads_routine_csvfiles/1722283353933.csv'
teachers = parse_csv(file_path)
schedule = initialize_schedule()
schedule = allocate_courses(teachers, schedule)
schedule = resolve_conflicts(schedule)
print_schedule(schedule)
