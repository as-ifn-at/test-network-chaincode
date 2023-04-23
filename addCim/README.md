## Adding Cim to the test network

You can use the `addCim.sh` script to add another organization to the Fabric test network. The `addCim.sh` script generates the Cim crypto material, creates an Cim organization definition, and adds Cim to a channel on the test network.

You first need to run `./network.sh up createChannel` in the `test-network` directory before you can run the `addCim.sh` script.

```
./network.sh up createChannel
cd addCim
./addCim.sh up
```

If you used `network.sh` to create a channel other than the default `mychannel`, you need pass that name to the `addcim.sh` script.
```
./network.sh up createChannel -c channel1
cd addCim
./addCim.sh up -c channel1
```

You can also re-run the `addCim.sh` script to add Cim to additional channels.
```
cd ..
./network.sh createChannel -c channel2
cd addCim
./addCim.sh up -c channel2
```

For more information, use `./addCim.sh -h` to see the `addCim.sh` help text.
