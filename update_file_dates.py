# -*- coding: utf-8 -*-
"""
This script updates the 'Date Modified' of files based on a date found inside the file.

It's designed to work with the output from the KeepSync web application,
which embeds the original note's creation date in the format:
'**Created:** YYYY-MM-DD HH:MM:SS'

Usage:
1. Place this script in a folder on your computer.
2. Make sure you have Python 3 installed.
3. Run the script from your terminal:
   python update_file_dates.py /path/to/your/notes

Replace '/path/to/your/notes' with the actual path to the folder containing
the Markdown files you downloaded from KeepSync.
"""
import os
import sys
import time
from datetime import datetime

# The format of the date string inside the file
# Example: **Created:** 2023-10-23 19:54:15
DATE_PREFIX = "**Created:** "
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def update_file_dates(directory_path):
    """
    Scans a directory for markdown files and updates their modification dates.
    """
    if not os.path.isdir(directory_path):
        print(f"Error: The directory '{directory_path}' does not exist.")
        return

    print(f"Scanning directory: {directory_path}\n")
    files_processed = 0
    files_updated = 0
    files_skipped = 0

    for filename in os.listdir(directory_path):
        if filename.endswith(".md"):
            files_processed += 1
            file_path = os.path.join(directory_path, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Find the creation date line
                date_str = None
                for line in content.splitlines():
                    if line.startswith(DATE_PREFIX):
                        date_str = line.replace(DATE_PREFIX, "").strip()
                        break
                
                if date_str:
                    # Parse the date string and convert to a timestamp
                    dt_object = datetime.strptime(date_str, DATE_FORMAT)
                    new_timestamp = time.mktime(dt_object.timetuple())

                    # Set the access and modification times
                    os.utime(file_path, (new_timestamp, new_timestamp))
                    files_updated += 1
                    print(f"Updated: {filename} -> {dt_object.strftime(DATE_FORMAT)}")
                else:
                    files_skipped += 1
                    print(f"Skipped: {filename} (No created date found)")

            except Exception as e:
                print(f"Error processing {filename}: {e}")
                files_skipped += 1

    print("\n--- Summary ---")
    print(f"Total files scanned: {files_processed}")
    print(f"Files updated: {files_updated}")
    print(f"Files skipped: {files_skipped}")
    print("---------------")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python update_file_dates.py <path_to_directory>")
        sys.exit(1)
        
    target_directory = sys.argv[1]
    update_file_dates(target_directory)
