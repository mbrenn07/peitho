# start by pulling the python image
FROM python:3.10

# copy the requirements file into the image
COPY ./requirements.txt /app/requirements.txt

# switch working directory
WORKDIR /app

EXPOSE 5000
ENV FLASK_APP=server.py

# install the dependencies and packages in the requirements file
RUN pip install -r requirements.txt
RUN pip install waitress

# copy every content from the local file to the image
COPY . /app

# configure the container to run in an executed manner
CMD ["waitress-serve", "--host=0.0.0.0", "--port=5000", "server:app"]