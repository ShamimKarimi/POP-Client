import { Component, ElementRef, ViewChild } from "@angular/core";
import * as handtrackjs from "handtrackjs";
import { ServerService } from "./server.service"

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  loadingStatus = "Loading...";

  @ViewChild("myvideo", { static: false })
  video: ElementRef;

  @ViewChild("canvas", { static: false })
  canvas: ElementRef;

  context: any;

  ngAfterViewInit() {
    this.context = (<HTMLCanvasElement>this.canvas.nativeElement).getContext(
      "2d"
    );
  }

  title = "pop";

  isVideo = false;
  model = null;

  modelParams = {
    flipHorizontal: true, // flip e.g for video
    maxNumBoxes: 4, // maximum number of boxes to detect
    iouThreshold: 0.5, // ioU threshold for non-max suppression
    scoreThreshold: 0.6, // confidence threshold for predictions.
    imageScaleFactor: 1
  };

  constructor(public server: ServerService, ) {

    // Load the model.
    handtrackjs.load(this.modelParams).then(lmodel => {
      this.model = lmodel;
      this.loadingStatus = "Model loaded!";
      this.startVideo();
    });
  }

  startVideo() {
    let self = this;
    this.setVideo(this.video).then(function(status) {
      console.log("video started", status);
      if (status) {
        self.isVideo = true;
        self.runDetection();
      } else {
      }
    });
  }

  setVideo(video) {
    return new Promise(function(resolve, reject) {
      let _video = video.nativeElement;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "user",
              width: 960,
              height: 540
            }
          })
          .then(stream => {
            _video.srcObject = stream;
            _video.play();
            resolve(true);
          });
      }
    });
  }

  toggleVideo() {
    if (!this.isVideo) {
      this.startVideo();
    } else {
      handtrackjs.stopVideo(this.video);
      this.isVideo = false;
    }
  }

  runDetection = function() {
    this.model.detect(this.video.nativeElement).then(predictions => {
      if (predictions.length > 0) {
        // console.log("Predictions: ", predictions);
      }
      this.analyzePrediction(predictions);
        // this.model.renderPredictions(
        //   predictions,
        //   this.canvas,
        //   this.context,
        //   this.video
        // );
      if (this.isVideo) {
        requestAnimationFrame(this.runDetection);
      }
    });
  }.bind(this);

  targetCenterX = [360, 600, 360, 600, 120, 840];
  targetCenterY = [135, 135, 405, 405, 270, 270];
  targetWidth = 240;
  targetHeight = 270;

  analyzePrediction(predictions) {
    for (let i = 0; i < predictions.length; i++) {
      var centerX = predictions[i].bbox[0] + predictions[i].bbox[2] / 2;
      var centerY = predictions[i].bbox[1] + predictions[i].bbox[3] / 2;

      var inTarget = false;
      var index = 0;

      for (let j = 0; j < this.targetCenterX.length; j++) {
        if (
          this.isInTarget(
            this.targetCenterX[j],
            this.targetCenterY[j],
            centerX,
            centerY
          )
        ) {
          inTarget = true;
          index = j;
          break;
        }
      }

      if (inTarget) {
        this.sendToGame(index);
      }
    }
  }

  isInTarget(targetCenterX, targetCenterY, pointX, pointY) {
    if (
      (targetCenterX - this.targetWidth / 2) < pointX &&
      pointX < (targetCenterX + this.targetWidth / 2) &&
      (targetCenterY - this.targetHeight / 2) < pointY &&
      pointY < (targetCenterY + this.targetHeight / 2)
    ) {
      return true;
    }
  }

  sendToGame(index) {
    var stringToSend: string;

    switch (index) {
      case 0:
        stringToSend = "UL";
        break;
      case 1:
        stringToSend = "UR";
        break;
      case 2:
        stringToSend = "DL";
        break;
      case 3:
        stringToSend = "DR";
        break;
      case 4:
        stringToSend = "SL";
        break;
      case 5:
        stringToSend = "SR";
        break;
      default:
        stringToSend = "ignore";
    }

    console.log(stringToSend);
    this.server.send(stringToSend);
  }
}
