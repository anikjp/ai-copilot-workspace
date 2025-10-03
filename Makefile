PYTHON := python3
PIP := pip3

.PHONY: install install-ts install-py build dev ts dev-ts run-py clean \
	python-app-venv python-app-run crewai-venv crewai-run py-venvs

install: install-ts install-py

install-ts:
	pnpm install

install-py:
	cd apps/python-app && $(PIP) install -e .

# Create venv for apps/python-app and install in editable mode
python-app-venv:
	cd apps/python-app && $(PYTHON) -m venv .venv && .venv/bin/pip install -U pip && .venv/bin/pip install -e .

# Run apps/python-app using its venv
python-app-run:
	cd apps/python-app && .venv/bin/python -m python_app

# Create in-project Poetry venv for apps/crewai-agents and install deps
crewai-venv:
	cd apps/crewai-agents && poetry config virtualenvs.in-project true && poetry install

# Run apps/crewai-agents using its Poetry venv
crewai-run:
	cd apps/crewai-agents && poetry run python main.py

# Convenience target to create both venvs
py-venvs: python-app-venv crewai-venv

build:
	pnpm run build

dev:
	@echo "Use 'npm run dev' for TS and 'make run-py' for Python"

dev-ts:
	pnpm run dev

run-py:
	$(PYTHON) -m python_app

	cd apps/workspace && pnpm run clean || true
	rm -rf apps/python-app/build apps/python-app/dist

