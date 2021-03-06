import firebase from 'firebase/app'

class DrawsService {

  findAllForOrganization(organizationId) {
    return firebase.firestore()
      .collection('draws')
      .where('organization', '==', organizationId)
      .orderBy('createdAt', 'desc');
  }

  create(draw) {
    draw.createdBy = firebase.auth().currentUser.uid;
    draw.createdAt = new Date().getTime();

    return firebase.firestore()
      .collection('draws')
      .add(draw);
  }

  update(draw, drawId) {
    draw.modifiedBy = firebase.auth().currentUser.uid;
    draw.modifiedAt = new Date().getTime();

    return firebase.firestore()
      .collection('draws')
      .doc(drawId)
      .set(draw);
  }

  findAndShuffleAllParticipantsForTwitterDraw(params) {
    return firebase.functions().httpsCallable('findAndShuffleAllParticipantsForTwitterDraw')({ params: params });
  }

}

export default new DrawsService()
