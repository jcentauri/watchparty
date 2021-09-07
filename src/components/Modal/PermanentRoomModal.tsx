import React from 'react';
import { Modal, Table, Icon } from 'semantic-ui-react';

export class PermanentRoomModal extends React.Component<{
  closeModal: Function;
}> {
  render() {
    const { closeModal } = this.props;
    return (
      <Modal open={true} onClose={closeModal as any} closeIcon>
        <Modal.Header>Permanent Rooms</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <div>

            </div>
            <Table definition unstackable striped celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell />
                  <Table.HeaderCell>Temporary</Table.HeaderCell>
                  <Table.HeaderCell>Permanent</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <Table.Row>
                  <Table.Cell>Expiry</Table.Cell>
                  <Table.Cell>After 24 hours of inactivity</Table.Cell>
                  <Table.Cell>Never</Table.Cell>
                </Table.Row>
              
          
              </Table.Body>
            </Table>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    );
  }
}
