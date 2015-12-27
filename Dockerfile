FROM nginx

RUN /bin/echo "192.168.254.10  proxy.cergy.eisti.fr" >> /etc/hosts \
    && export http_proxy=http://proxy.cergy.eisti.fr:3128 \
    && export https_proxy=http://proxy.cergy.eisti.fr:3128 \
    && apt-get update \
    && apt-get install -y -q --no-install-recommends \
        wget \
        unzip \
    && apt-get clean \
    && rm -r /var/lib/apt/lists/* \
    && cd ~ \
    && wget https://github.com/snigle/GitHubStats/archive/master.zip \
    && unzip *.zip \
    && rm *.zip \
    && mv GitHubStats-master/public/* /usr/share/nginx/html/

