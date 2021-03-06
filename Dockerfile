FROM java

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
    && cd GitHubStats-master/ \
    && ./activator dist \
    && cd target/universal \
    && unzip zengularity*.zip \
    && rm zengularity*.zip

EXPOSE 80

ENTRYPOINT cd GitHubStats-master/target/universal/zengularity*/ \
          && ./bin/zengularity

cmd ["-Dhttp.proxyHost","-Dhttp.proxyPort", "-Dhttp.port"]

