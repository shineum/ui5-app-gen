FROM node:22.12.0-bookworm

RUN mkdir -p /opt/app
RUN cd /opt/app && git clone https://github.com/shineum/ui5-app-gen.git
RUN cd /opt/app/ui5-app-gen && npm install
WORKDIR /opt/app/ui5-app-gen

CMD [ "npm", "start" ]