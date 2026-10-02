"""Execute companion notebooks with a real Python kernel in temporary copies."""
from pathlib import Path
import json
import shutil
import subprocess
import sys
import tempfile
import nbformat
from nbclient import NotebookClient
from jupyter_client.kernelspec import KernelSpecManager

ROOT = Path(__file__).resolve().parents[1]


def main():
    cells_only = '--cells' in sys.argv
    packages = [x for x in sys.argv[1:] if x != '--cells'] or ['engineering-foundations']
    with tempfile.TemporaryDirectory(prefix='content-notebooks-') as temp:
        dest = Path(temp)
        kernel_dir = dest/'kernel'
        kernel_dir.mkdir()
        (kernel_dir/'kernel.json').write_text(json.dumps({'argv': [sys.executable, '-m', 'ipykernel_launcher', '-f', '{connection_file}'], 'display_name': 'Companion validation', 'language': 'python'}))
        manager = KernelSpecManager(kernel_dirs=[str(dest)])
        for name in packages:
            source = ROOT/'project-sources'/name
            copy = dest/name
            shutil.copytree(source, copy, ignore=shutil.ignore_patterns('__pycache__', '.ipynb_checkpoints'))
            for path in sorted((copy/'notebooks').glob('*.ipynb')):
                notebook = nbformat.read(path, as_version=4)
                nbformat.validate(notebook)
                if cells_only:
                    # This mode validates notebook structure and executes its code in
                    # order; it does not claim to test Jupyter's kernel transport.
                    code = '\n\n'.join(c.source for c in notebook.cells if c.cell_type == 'code')
                    subprocess.run([sys.executable, '-c', code], cwd=path.parent, check=True,
                                   stdout=subprocess.DEVNULL, timeout=90)
                    print(f'PASS CELLS {name}/{path.name}', flush=True)
                    continue
                client = NotebookClient(notebook, timeout=90, kernel_name='kernel', resources={'metadata': {'path': str(path.parent)}})
                km = client.create_kernel_manager()
                km.kernel_spec_manager = manager
                client.execute()
                print(f'PASS {name}/{path.name}', flush=True)


if __name__ == '__main__': main()
