#!/usr/bin/env python3
"""Stage the contents of app/ for GitHub Pages, omitting app/checks/."""

from __future__ import annotations

import argparse
import os
import shutil
import stat
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve()
REPO = SCRIPT.parent.parent
SOURCE = REPO / "app"
EXCLUDED = "checks"


def is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def copy_tree(source: Path, destination: Path, relative: Path = Path()) -> int:
    count = 0
    for entry in sorted(os.scandir(source), key=lambda item: item.name):
        if not relative.parts and entry.name == EXCLUDED:
            continue

        source_path = Path(entry.path)
        output_path = destination / entry.name
        mode = entry.stat(follow_symlinks=False).st_mode
        if stat.S_ISLNK(mode):
            raise ValueError(f"refusing symbolic link in runtime source: {source_path}")
        if stat.S_ISDIR(mode):
            output_path.mkdir()
            count += copy_tree(source_path, output_path, relative / entry.name)
        elif stat.S_ISREG(mode):
            shutil.copyfile(source_path, output_path, follow_symlinks=False)
            count += 1
        else:
            raise ValueError(f"refusing unsupported source file: {source_path}")
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_directory", type=Path, help="empty directory to receive the staged runtime")
    args = parser.parse_args()

    source = SOURCE.resolve(strict=True)
    output_arg = args.output_directory.expanduser()
    output = output_arg.resolve(strict=False)
    git_dir = (REPO / ".git").resolve(strict=False)

    if is_within(output, source):
        raise ValueError(f"output directory must be outside app/: {output}")
    if is_within(output, git_dir):
        raise ValueError(f"output directory must be outside .git/: {output}")
    if output == source or output == git_dir:
        raise ValueError(f"output directory is reserved: {output}")
    if output_arg.is_symlink():
        raise ValueError(f"output directory must not be a symbolic link: {output_arg}")
    if output.exists():
        if not output.is_dir():
            raise ValueError(f"output path is not a directory: {output}")
        if any(output.iterdir()):
            raise ValueError(f"output directory must be empty: {output}")
    else:
        output.mkdir(parents=True)

    count = copy_tree(source, output)
    print(f"Staged {count} runtime files at {output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(f"stage-pages: {error}", file=sys.stderr)
        raise SystemExit(1)
